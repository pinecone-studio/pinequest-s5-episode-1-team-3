"""Алхам 4: бичлэг бүрийг YAMNet-ийн 521 онооны дундаж + max (1042 тоо) болгоно.

Оролт:  data/manifest.csv, data/16k/…wav (prepare.py)
Гаралт: data/features.npz (X, label, split, group, name). Git-д орохгүй.

Ажиллуулах: sh ../../server/scripts/download_models.sh && .venv/bin/python features.py
"""

import csv
import logging
import wave
from pathlib import Path

import mediapipe as mp
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).resolve().parent / "data"
MANIFEST = DATA / "manifest.csv"
FEATURES = DATA / "features.npz"
# Сервертэй яг ижил загвар (server/scripts/download_models.sh татна).
YAMNET = ROOT / "server" / "models" / "yamnet.tflite"
YAMNET_CLASSES = 521
PCM_SCALE = 32_768

logger = logging.getLogger("features")


def load_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as audio:
        pcm = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16)
        return pcm.astype(np.float32) / PCM_SCALE, audio.getframerate()


def create_yamnet() -> mp.tasks.audio.AudioClassifier:
    options = mp.tasks.audio.AudioClassifierOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(YAMNET)),
        max_results=-1,  # 521 оноо бүгд хэрэгтэй, зөвхөн эхний хэд нь биш
        running_mode=mp.tasks.audio.RunningMode.AUDIO_CLIPS,
    )
    return mp.tasks.audio.AudioClassifier.create_from_options(options)


def clip_scores(yamnet: mp.tasks.audio.AudioClassifier, samples: np.ndarray, rate: int) -> np.ndarray:
    """~1 сек тутмын оноо: (хэсгийн тоо, 521). Ангилал бүрийг index-ээр нь байранд нь тавина."""
    results = yamnet.classify(mp.tasks.components.containers.AudioData.create_from_array(samples, rate))
    scores = np.zeros((len(results), YAMNET_CLASSES), dtype=np.float32)
    for row, result in zip(scores, results, strict=True):
        for category in result.classifications[0].categories:
            row[category.index] = category.score
    return scores


# shortcut: сервер (Алхам 8) яг энэ функцийг ашиглах ёстой. Тэр үед sound.py руу шилжүүлж эндээс import хийнэ.
def head_features(scores: np.ndarray) -> np.ndarray:
    """Дундаж нь «бүхэлдээ юу сонсогдов», max нь «богино тогшилт, хонх» -ыг барина."""
    return np.concatenate([scores.mean(axis=0), scores.max(axis=0)])


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with MANIFEST.open(newline="") as manifest:
        rows = list(csv.DictReader(manifest))
    yamnet = create_yamnet()
    features, kept = [], []
    for i, row in enumerate(rows, start=1):
        scores = clip_scores(yamnet, *load_wav(DATA / "16k" / row["name"]))
        if len(scores) == 0:
            logger.warning("YAMNet-д хэт богино, алгаслаа: %s", row["name"])
            continue
        features.append(head_features(scores))
        kept.append(row)
        if i % 500 == 0:
            logger.info("%d / %d", i, len(rows))
    np.savez_compressed(
        FEATURES,
        X=np.stack(features),
        **{key: np.array([row[key] for row in kept]) for key in ("label", "split", "group", "name")},
    )
    logger.info("%d бичлэг × %d тоо → %s", len(kept), features[0].size, FEATURES.relative_to(ROOT))


if __name__ == "__main__":
    main()
