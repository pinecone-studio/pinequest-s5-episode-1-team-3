"""Алхам 4: бичлэгийг апп шиг 3 сек хэсэг болгож, хэсэг бүрийг YAMNet 521 онооны дундаж + max (1042) болгоно.

Серверийн YamnetClassifier.scores, head_features-ийг шууд ашиглана: сургалт, сервер нэг дууг ижил сонсоно.

Оролт:  data/manifest.csv, data/16k/…wav (prepare.py)
Гаралт: data/features.npz. Git-д орохгүй.
    X, clip       хэсэг бүрийн 1042 тоо ба аль бичлэгийнх вэ
    label, split, group, name   бичлэг бүрийн (clip-ээр индекслэнэ)

Ажиллуулах: sh ../../server/scripts/download_models.sh && .venv/bin/python features.py
"""

import csv
import logging
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
from app.audio import SAMPLE_RATE  # noqa: E402
from app.models.sound import YamnetClassifier, head_features  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
MANIFEST = DATA / "manifest.csv"
FEATURES = DATA / "features.npz"
YAMNET = ROOT / "server" / "models" / "yamnet.tflite"
PCM_SCALE = 32_768
PROGRESS_EVERY = 1000
# Апп 3 сек тутам илгээдэг (mobile/src/config.ts → recordChunkMs).
# 30 сек бичлэгийн дундаж богино хонхыг уусгадаг.
SEGMENT_SECONDS = 3

logger = logging.getLogger("features")


def load_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as audio:
        assert audio.getframerate() == SAMPLE_RATE, f"{path}: prepare.py-г дахин ажиллуул"
        pcm = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16)
    return pcm.astype(np.float32) / PCM_SCALE


def segments(samples: np.ndarray) -> list[np.ndarray]:
    size = SAMPLE_RATE * SEGMENT_SECONDS
    parts = [samples[start : start + size] for start in range(0, len(samples), size)]
    # 1 сек хүрэхгүй үлдэгдлийг өмнөхтэй нь нийлүүлнэ: дуу төгсгөлд нь байж болно.
    if len(parts) > 1 and len(parts[-1]) < SAMPLE_RATE:
        parts[-2:] = [np.concatenate(parts[-2:])]
    return parts


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with MANIFEST.open(newline="") as manifest:
        rows = list(csv.DictReader(manifest))
    yamnet = YamnetClassifier(str(YAMNET), min_score=0.0)
    features, clips = [], []
    for i, row in enumerate(rows):
        for part in segments(load_wav(DATA / "16k" / row["name"])):
            scores = yamnet.scores(part)
            if len(scores):
                features.append(head_features(scores))
                clips.append(i)
        if (i + 1) % PROGRESS_EVERY == 0:
            logger.info("%d / %d", i + 1, len(rows))
    np.savez_compressed(
        FEATURES,
        X=np.stack(features),
        clip=np.array(clips),
        **{key: np.array([row[key] for row in rows]) for key in ("label", "split", "group", "name")},
    )
    logger.info(
        "%d бичлэг → %d хэсэг × %d тоо → %s",
        len(rows),
        len(clips),
        features[0].size,
        FEATURES.relative_to(ROOT),
    )


if __name__ == "__main__":
    main()
