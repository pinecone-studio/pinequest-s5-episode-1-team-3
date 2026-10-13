"""Алхам 6: серверийн одоогийн арга (baseline) ба MLP толгойг ижил test дээр харьцуулна.

Хоёулаа серверийн кодоор (pick_label, SoundHead) тооцогдоно: энд гарсан тоо = сервер дээрх тоо.

Ажиллуулах: .venv/bin/python evaluate.py   (train.py-ийн дараа)
"""

import logging
import sys
import wave
from pathlib import Path

import numpy as np

from train import ALERTS, FEATURES, HEAD_JSON, TARGET_PRECISION, precision

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
from app.models.sound import YAMNET_CLASSES, SoundHead, pick_label, yamnet_names  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
YAMNET = ROOT / "server" / "models" / "yamnet.tflite"
BASELINE_MIN_SCORE = 0.3  # server/app/config.py → sound_min_score
TARGET_RECALL = 0.85
MAX_FALSE_PER_HOUR = 1.0
SECONDS_PER_HOUR = 3600

logger = logging.getLogger("evaluate")


def baseline_predict(x: np.ndarray) -> np.ndarray:
    """features-ийн max хэсэг = ангилал бүрийн хамгийн их оноо (сервер ч ингэж нэгтгэдэг)."""
    names = yamnet_names(str(YAMNET))
    labels = []
    for row in x[:, YAMNET_CLASSES:]:
        result = pick_label(dict(zip(names, row.tolist(), strict=True)), BASELINE_MIN_SCORE)
        labels.append(result.label if result else "other")
    return np.array(labels)


def background_hours(names: np.ndarray) -> float:
    seconds = 0.0
    for name in names:
        with wave.open(str(DATA / "16k" / name), "rb") as audio:
            seconds += audio.getnframes() / audio.getframerate()
    return seconds / SECONDS_PER_HOUR


def report(title: str, truth: np.ndarray, predicted: np.ndarray, hours: float) -> None:
    logger.info("\n%s", title)
    for label in (label for label in ALERTS if (truth == label).any()):
        hit = predicted == label
        recall = float((hit & (truth == label)).sum() / (truth == label).sum())
        prec = precision(truth == label, hit)
        ok = "✅" if prec >= TARGET_PRECISION and recall >= TARGET_RECALL else "❌"
        logger.info(
            "  %-9s precision %.3f  recall %.3f  (%d бичлэг) %s",
            label,
            prec,
            recall,
            (truth == label).sum(),
            ok,
        )
    false_alerts = np.isin(predicted, ALERTS) & ~np.isin(truth, ALERTS)
    per_hour = false_alerts.sum() / hours
    ok = "✅" if per_hour <= MAX_FALSE_PER_HOUR else "❌"
    logger.info(
        "  худал мэдэгдэл: %d → цагт %.1f %s (ойролцоо: санд байгаа «бусад» ≠ гэрийн дуу)",
        false_alerts.sum(),
        per_hour,
        ok,
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    data = np.load(FEATURES)
    rows = data["split"] == "test"
    x, truth = data["X"][rows], data["label"][rows]
    hours = background_hours(data["name"][rows & ~np.isin(data["label"], ALERTS)])
    head = SoundHead(str(HEAD_JSON))
    probs = head.probabilities(x)

    report("Baseline (серверийн LABEL_MAP)", truth, baseline_predict(x), hours)
    report("MLP толгой (argmax)", truth, np.array(head.classes)[probs.argmax(axis=1)], hours)
    report(
        "MLP толгой + босго (сервер ингэж ажиллана)",
        truth,
        np.array([head.label(p).label for p in probs]),
        hours,
    )


if __name__ == "__main__":
    main()
