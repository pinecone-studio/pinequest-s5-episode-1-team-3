"""Алхам 6: серверийн одоогийн арга (baseline) ба MLP толгойг ижил test дээр харьцуулна.

Босгыг train дээр cross-validation-аар сонгоно (test дээр сонговол тоо хуурамчаар сайн гарна).
Гаралт: data/sound_thresholds.json (ангилал бүрийн босго). Git-д орохгүй.

Ажиллуулах: .venv/bin/python evaluate.py
"""

import json
import logging
import sys
import wave
import zipfile
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import GroupKFold

from train import FEATURES, HEAD, train

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
# Baseline = сервер яг одоо ажиллуулж буй функц, хуулбар биш.
from app.models.sound import pick_label  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
YAMNET = ROOT / "server" / "models" / "yamnet.tflite"
THRESHOLDS_JSON = DATA / "sound_thresholds.json"
ALERTS = ("knock", "doorbell", "alarm")
YAMNET_CLASSES = 521
BASELINE_MIN_SCORE = 0.3  # server/app/config.py → sound_min_score
TARGET_PRECISION = 0.95
TARGET_RECALL = 0.85
MAX_FALSE_PER_HOUR = 1.0
CV_FOLDS = 5
THRESHOLDS = np.round(np.arange(0.30, 1.0, 0.05), 2)
SECONDS_PER_HOUR = 3600

logger = logging.getLogger("evaluate")


def yamnet_names() -> list[str]:
    # Ангиллын нэрс tflite файлд zip хэлбэрээр шингэсэн: MediaPipe ачаалах шаардлагагүй.
    with zipfile.ZipFile(YAMNET) as model:
        return model.read("yamnet_label_list.txt").decode().splitlines()


def baseline_predict(x: np.ndarray, names: list[str]) -> np.ndarray:
    """features.py-ийн max хэсэг = бичлэгийн ангилал бүрийн хамгийн их оноо (сервер ч ингэж нэгтгэдэг)."""
    labels = []
    for row in x[:, YAMNET_CLASSES:]:
        result = pick_label(dict(zip(names, row.tolist(), strict=True)), BASELINE_MIN_SCORE)
        labels.append(result.label if result else "other")
    return np.array(labels)


def out_of_fold_probs(x: np.ndarray, y: np.ndarray, groups: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    classes = np.unique(y)
    probs = np.zeros((len(y), len(classes)))
    for fit_rows, held_rows in GroupKFold(n_splits=CV_FOLDS).split(x, y, groups):
        head = train(x[fit_rows], y[fit_rows])
        probs[np.ix_(held_rows, np.searchsorted(classes, head.classes_))] = head.predict_proba(x[held_rows])
    return probs, classes


def head_predict(probs: np.ndarray, classes: np.ndarray, thresholds: dict[str, float]) -> np.ndarray:
    """Босгоо давсан мэдэгдлийн ангиллаас хамгийн итгэлтэйг нь сонгоно. Аль нь ч давахгүй бол other."""
    gated = np.zeros_like(probs)
    for i, label in enumerate(classes):
        if label in thresholds:
            gated[:, i] = np.where(probs[:, i] >= thresholds[label], probs[:, i], 0)
    return np.where(gated.max(axis=1) > 0, classes[gated.argmax(axis=1)], "other")


def pick_thresholds(probs: np.ndarray, y: np.ndarray, classes: np.ndarray) -> dict[str, float]:
    """Precision ≥95% хангах хамгийн бага босго (recall хамгийн их). Хангахгүй бол хамгийн өндөр."""
    chosen = {}
    for label in (label for label in ALERTS if label in classes):
        column = probs[:, np.flatnonzero(classes == label)[0]]
        passing = [t for t in THRESHOLDS if precision(y == label, column >= t) >= TARGET_PRECISION]
        chosen[label] = float(passing[0] if passing else THRESHOLDS[-1])
    return chosen


def precision(truth: np.ndarray, flagged: np.ndarray) -> float:
    return float((truth & flagged).sum() / flagged.sum()) if flagged.any() else 0.0


def report(title: str, truth: np.ndarray, predicted: np.ndarray, background_hours: float) -> None:
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
    per_hour = false_alerts.sum() / background_hours
    ok = "✅" if per_hour <= MAX_FALSE_PER_HOUR else "❌"
    logger.info(
        "  худал мэдэгдэл: %d → цагт %.1f %s (ойролцоо: ESC-50 other ≠ гэрийн дуу)",
        false_alerts.sum(),
        per_hour,
        ok,
    )


def background_hours(names: np.ndarray) -> float:
    seconds = 0.0
    for name in names:
        with wave.open(str(DATA / "16k" / name), "rb") as audio:
            seconds += audio.getnframes() / audio.getframerate()
    return seconds / SECONDS_PER_HOUR


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    data = np.load(FEATURES)
    x, y, groups, names = data["X"], data["label"], data["group"], data["name"]
    train_rows, test_rows = data["split"] == "train", data["split"] == "test"

    probs, classes = out_of_fold_probs(x[train_rows], y[train_rows], groups[train_rows])
    thresholds = pick_thresholds(probs, y[train_rows], classes)
    THRESHOLDS_JSON.write_text(json.dumps(thresholds, indent=2))
    logger.info("Босго (train CV-ээр сонгосон): %s", thresholds)

    head = joblib.load(HEAD)
    test_truth = y[test_rows]
    hours = background_hours(names[test_rows & ~np.isin(y, ALERTS)])
    report(
        "Baseline (серверийн LABEL_MAP)", test_truth, baseline_predict(x[test_rows], yamnet_names()), hours
    )
    head_probs = head.predict_proba(x[test_rows])
    report("MLP толгой (argmax)", test_truth, head.classes_[head_probs.argmax(axis=1)], hours)
    report("MLP толгой (босготой)", test_truth, head_predict(head_probs, head.classes_, thresholds), hours)


if __name__ == "__main__":
    main()
