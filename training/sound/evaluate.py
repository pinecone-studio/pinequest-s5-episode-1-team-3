"""Алхам 6: серверийн одоогийн арга (baseline) ба MLP толгойг апп шиг 3 сек хэсгээр, ижил test дээр хэмжинэ.

Бичлэгийн аль нэг хэсэгт таньвал «илрүүлсэн». Худал мэдэгдлийг хэсэг бүрээр (= аппын нэг хүсэлт) тоолно.
Хоёулаа серверийн кодоор (pick_label, SoundHead) тооцогдоно: энд гарсан тоо = сервер дээрх тоо.

Ажиллуулах: .venv/bin/python evaluate.py   (train.py-ийн дараа)
Зөвхөн HF-ийн features.npz-тэй (түүхий бичлэггүй) үед ч ажиллана: README → «HF-ээс давтан сургах».
"""

import logging
import sys
import wave
from pathlib import Path

import numpy as np
from features import SEGMENT_SECONDS
from train import ALERTS, FEATURES, HEAD_JSON, TARGET_PRECISION, YAMNET, precision

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
from app.models.sound import YAMNET_CLASSES, SoundHead, pick_label, yamnet_names  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
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


def background_hours(names: np.ndarray, windows: int) -> float:
    """«Бусад» бичлэгийн нийт урт (цаг). Худал мэдэгдлийг цагт хувиргахад хэрэгтэй.

    Түүхий бичлэг (data/16k) нэг хүний компьютерт л байдаг. Байхгүй бол HF-ийн features.npz-ийн
    хэсгийн тоо × 3 сек-ээр тооцно. Сүүлийн хэсэг 1–4 сек байж болох тул ойролцоо.
    """
    if not (DATA / "16k").exists():
        return windows * SEGMENT_SECONDS / SECONDS_PER_HOUR
    seconds = 0.0
    for name in names:
        with wave.open(str(DATA / "16k" / name), "rb") as audio:
            seconds += audio.getnframes() / audio.getframerate()
    return seconds / SECONDS_PER_HOUR


def report(
    title: str, truth: np.ndarray, predicted: np.ndarray, window_clip: np.ndarray, hours: float
) -> None:
    """truth: test бичлэг бүрийн шошго. predicted, window_clip: test хэсэг бүрийн таамаг, аль бичлэгийнх."""
    logger.info("\n%s", title)
    for label in (label for label in ALERTS if (truth == label).any()):
        flagged = np.zeros(len(truth), dtype=bool)
        flagged[window_clip[predicted == label]] = True
        recall = float((flagged & (truth == label)).sum() / (truth == label).sum())
        prec = precision(truth == label, flagged)
        ok = "✅" if prec >= TARGET_PRECISION and recall >= TARGET_RECALL else "❌"
        count = (truth == label).sum()
        logger.info("  %-9s precision %.3f  recall %.3f  (%d бичлэг) %s", label, prec, recall, count, ok)
    false_alerts = np.isin(predicted, ALERTS) & ~np.isin(truth[window_clip], ALERTS)
    per_hour = false_alerts.sum() / hours
    ok = "✅" if per_hour <= MAX_FALSE_PER_HOUR else "❌"
    logger.info(
        "  худал мэдэгдэл: %d хэсэг → цагт %.1f %s (ойролцоо: санд байгаа «бусад» ≠ гэрийн дуу)",
        false_alerts.sum(),
        per_hour,
        ok,
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    data = np.load(FEATURES)
    x, clip, labels, names = data["X"], data["clip"], data["label"], data["name"]
    test_clips = np.flatnonzero(data["split"] == "test")
    rows = np.isin(clip, test_clips)
    window_clip = np.searchsorted(test_clips, clip[rows])  # test бичлэгийг 0..n гэж дахин дугаарлана
    truth = labels[test_clips]
    quiet_windows = int((~np.isin(truth[window_clip], ALERTS)).sum())
    hours = background_hours(names[test_clips][~np.isin(truth, ALERTS)], quiet_windows)
    head = SoundHead(str(HEAD_JSON))
    probs = head.probabilities(x[rows].astype(np.float64))

    report("Baseline (серверийн LABEL_MAP)", truth, baseline_predict(x[rows]), window_clip, hours)
    served = np.array([head.label(p).label for p in probs])
    report("MLP толгой + босго (сервер ингэж ажиллана)", truth, served, window_clip, hours)


if __name__ == "__main__":
    main()
