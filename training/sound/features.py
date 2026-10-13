"""Алхам 4: бичлэг бүрийг YAMNet-ийн 521 онооны дундаж + max (1042 тоо) болгоно.

Серверийн YamnetClassifier.scores, head_features-ийг шууд ашиглана: сургалт, сервер нэг дууг ижил сонсоно.

Оролт:  data/manifest.csv, data/16k/…wav (prepare.py)
Гаралт: data/features.npz (X, label, split, group, name). Git-д орохгүй.

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

logger = logging.getLogger("features")


def load_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as audio:
        assert audio.getframerate() == SAMPLE_RATE, f"{path}: prepare.py-г дахин ажиллуул"
        pcm = np.frombuffer(audio.readframes(audio.getnframes()), dtype=np.int16)
    return pcm.astype(np.float32) / PCM_SCALE


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with MANIFEST.open(newline="") as manifest:
        rows = list(csv.DictReader(manifest))
    yamnet = YamnetClassifier(str(YAMNET), min_score=0.0)
    features, kept = [], []
    for i, row in enumerate(rows, start=1):
        scores = yamnet.scores(load_wav(DATA / "16k" / row["name"]))
        if len(scores) == 0:
            logger.warning("YAMNet оноо өгсөнгүй, алгаслаа: %s", row["name"])
            continue
        features.append(head_features(scores))
        kept.append(row)
        if i % PROGRESS_EVERY == 0:
            logger.info("%d / %d", i, len(rows))
    np.savez_compressed(
        FEATURES,
        X=np.stack(features),
        **{key: np.array([row[key] for row in kept]) for key in ("label", "split", "group", "name")},
    )
    logger.info("%d бичлэг × %d тоо → %s", len(kept), features[0].size, FEATURES.relative_to(ROOT))


if __name__ == "__main__":
    main()
