"""Орчны дуу таних: YAMNet (MediaPipe) → knock / doorbell / alarm / speech / other.

YAMNet-ийн 521 ангиллыг манай 5 ангилал руу ЗӨВХӨН энд хөрвүүлнэ (AGENTS.md → API гэрээ).
Дараагийн шатанд YAMNet дээр сургасан толгой (SOUND_HEAD_MODEL) энд нэмэгдэнэ.
"""

from __future__ import annotations

import logging
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
MAX_RESULTS = 10
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
        if best is None or score > best.score:
            best = SoundResult(label=label, score=round(score, 3))
    return best


class YamnetClassifier:
    def __init__(self, model_path: str, min_score: float) -> None:
        import mediapipe as mp  # хүнд сан: зөвхөн серверт ачаална, тестэд биш

        self._mp = mp
        self._min_score = min_score
        options = mp.tasks.audio.AudioClassifierOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
            max_results=MAX_RESULTS,
            running_mode=mp.tasks.audio.RunningMode.AUDIO_CLIPS,
        )
        self._classifier = mp.tasks.audio.AudioClassifier.create_from_options(options)

    def classify(self, samples: np.ndarray) -> SoundResult | None:
        clip = self._mp.tasks.components.containers.AudioData.create_from_array(
            samples.astype(np.float32), SAMPLE_RATE
        )
        scores: dict[str, float] = {}
        # YAMNet ~1 секунд тутамд үр дүн өгнө. Ангилал бүрийн хамгийн өндөр оноог авна.
        for chunk in self._classifier.classify(clip):
            for category in chunk.classifications[0].categories:
                name = category.category_name
                scores[name] = max(scores.get(name, 0.0), category.score)
        # Жинхэнэ дуун дээр ангиллыг тааруулахад хэрэгтэй: YAMNet юу гэж сонссоныг лог руу бичнэ
        top = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:LOG_TOP]
        logger.info("YAMNet: %s", ", ".join(f"{name} {score:.2f}" for name, score in top))
        return pick_label(scores, self._min_score)
