"""Орчны дуу таних: YAMNet (MediaPipe) → knock / doorbell / alarm / speech / other.

YAMNet-ийн 521 ангиллыг манай 5 ангилал руу ЗӨВХӨН энд хөрвүүлнэ (AGENTS.md → API гэрээ):
SOUND_HEAD_MODEL байвал сургасан MLP толгой (training/sound/), үгүй бол LABEL_MAP.
training/sound/ яг энэ файлын scores, head_features-ийг ашигладаг: сургалт, сервер ижил сонсоно.
"""

from __future__ import annotations

import json
import logging
import zipfile
from pathlib import Path
from typing import Protocol

import numpy as np

from app.audio import SAMPLE_RATE
from app.schemas import SoundLabel, SoundResult

LABEL_MAP: dict[str, SoundLabel] = {
    "Knock": "knock",
    "Tap": "knock",
    "Door": "knock",  # YAMNet хаалганы дуу (тогших, онгойх) — хүн ирсэн гэсэн дохио
    "Thump, thud": "knock",
    "Doorbell": "doorbell",
    "Ding-dong": "doorbell",
    "Buzzer": "doorbell",  # домофон
    "Alarm": "alarm",
    "Alarm clock": "alarm",
    "Smoke detector, smoke alarm": "alarm",
    "Beep, bleep": "alarm",
    "Speech": "speech",
    "Conversation": "speech",
    "Narration, monologue": "speech",
}
YAMNET_CLASSES = 521
LOG_TOP = 3

logger = logging.getLogger("signo")


class SoundClassifier(Protocol):
    def classify(self, samples: np.ndarray) -> SoundResult | None: ...


def pick_label(scores: dict[str, float], min_score: float) -> SoundResult | None:
    """YAMNet-ийн ангилал → оноо. Манай ангилалд орох хамгийн өндөр оноотойг сонгоно."""
    best: SoundResult | None = None
    for name, score in scores.items():
        label = LABEL_MAP.get(name)
        if label is None or score < min_score:
            continue
        # Talking in the room must not hide a knock or doorbell in the same clip.
        if best is None or (label != "speech", score) > (best.label != "speech", best.score):
            best = SoundResult(label=label, score=round(score, 3))
    return best


def yamnet_names(model_path: str) -> list[str]:
    """521 ангиллын нэр. tflite файлд zip хэлбэрээр шингэсэн байдаг."""
    with zipfile.ZipFile(model_path) as model:
        return model.read("yamnet_label_list.txt").decode().splitlines()


def head_features(scores: np.ndarray) -> np.ndarray:
    """(хэсэг, 521) → 1042. Дундаж нь «бүхэлдээ юу сонсогдов», max нь богино тогшилт, хонхыг барина."""
    return np.concatenate([scores.mean(axis=0), scores.max(axis=0)])


class SoundHead:
    """training/sound/train.py-ийн сургасан MLP (sound_head.json).

    sklearn биш numpy: серверт шинэ сан хэрэггүй, утсан дээр ч яг ижил JSON ажиллана.
    """

    def __init__(self, path: str) -> None:
        weights = json.loads(Path(path).read_text())
        # Файл HF Hub-аас ирнэ: тооцоолж чадахгүй хэлбэр бол сервер асахдаа л унана.
        if weights["activation"] != "relu" or len(weights["classes"]) < 3:
            raise ValueError("sound_head.json: зөвхөн relu, 3+ ангиллын MLP дэмжинэ")
        self.classes: list[SoundLabel] = weights["classes"]
        self.thresholds: dict[str, float] = weights["thresholds"]
        self._mean = np.array(weights["mean"])
        self._scale = np.array(weights["scale"])
        self._layers = [
            (np.array(weight), np.array(bias))
            for weight, bias in zip(weights["coefs"], weights["intercepts"], strict=True)
        ]

    def probabilities(self, features: np.ndarray) -> np.ndarray:
        x = (features - self._mean) / self._scale
        for weight, bias in self._layers[:-1]:
            x = np.maximum(x @ weight + bias, 0)
        logits = x @ self._layers[-1][0] + self._layers[-1][1]
        exp = np.exp(logits - logits.max(axis=-1, keepdims=True))
        return exp / exp.sum(axis=-1, keepdims=True)

    def label(self, probs: np.ndarray) -> SoundResult:
        """Босгоо давсан мэдэгдлийн ангиллаас хамгийн итгэлтэйг. Аль нь ч давахгүй бол speech/other."""
        ranked = sorted(zip(probs.tolist(), self.classes, strict=True), reverse=True)
        alerts = [(p, label) for p, label in ranked if p >= self.thresholds.get(label, 2.0)]
        quiet = [(p, label) for p, label in ranked if label not in self.thresholds]
        score, label = (alerts or quiet)[0]
        return SoundResult(label=label, score=round(score, 3))


class YamnetClassifier:
    def __init__(self, model_path: str, min_score: float, head_path: str = "") -> None:
        import mediapipe as mp  # хүнд сан: зөвхөн серверт ачаална, тестэд биш

        self._mp = mp
        self._min_score = min_score
        self._names = yamnet_names(model_path)
        self._head = SoundHead(head_path) if head_path else None
        options = mp.tasks.audio.AudioClassifierOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
            max_results=-1,  # толгойд 521 оноо бүгд хэрэгтэй
            running_mode=mp.tasks.audio.RunningMode.AUDIO_CLIPS,
        )
        self._classifier = mp.tasks.audio.AudioClassifier.create_from_options(options)

    def scores(self, samples: np.ndarray) -> np.ndarray:
        """~1 сек тутмын оноо: (хэсэг, 521). Ангилал бүр index-ээрээ байрандаа."""
        clip = self._mp.tasks.components.containers.AudioData.create_from_array(
            samples.astype(np.float32), SAMPLE_RATE
        )
        results = self._classifier.classify(clip)
        scores = np.zeros((len(results), YAMNET_CLASSES), dtype=np.float32)
        for row, result in zip(scores, results, strict=True):
            for category in result.classifications[0].categories:
                row[category.index] = category.score
        return scores

    def classify(self, samples: np.ndarray) -> SoundResult | None:
        scores = self.scores(samples)
        if len(scores) == 0:
            return None
        peak = scores.max(axis=0)
        # Жинхэнэ дуун дээр ангиллыг тааруулахад хэрэгтэй: YAMNet юу гэж сонссоныг лог руу бичнэ
        top = np.argsort(peak)[::-1][:LOG_TOP]
        logger.info("YAMNet: %s", ", ".join(f"{self._names[i]} {peak[i]:.2f}" for i in top))
        if self._head is not None:
            return self._head.label(self._head.probabilities(head_features(scores)))
        return pick_label(dict(zip(self._names, peak.tolist(), strict=True)), self._min_score)
