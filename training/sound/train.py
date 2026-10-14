"""Алхам 5: 3 сек хэсгийн YAMNet шинж (features.npz) дээр MLP толгой сургаж, босгыг train дээр сонгоно.

Гаралт (Git-д орохгүй):
    data/sound_head.json     сервер (SOUND_HEAD_MODEL) болон утас ачаална: scaler + давхарга + босго
    data/sound_head.joblib   sklearn загвар өөрөө (даалгаврын гаралт)

Ажиллуулах: .venv/bin/python train.py
"""

import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.model_selection import GroupKFold
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
from app.models.sound import LABEL_MAP, YAMNET_CLASSES, SoundHead, yamnet_names  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
FEATURES = DATA / "features.npz"
HEAD = DATA / "sound_head.joblib"
HEAD_JSON = DATA / "sound_head.json"
YAMNET = ROOT / "server" / "models" / "yamnet.tflite"
ALERTS = ("knock", "doorbell", "alarm")
HIDDEN_UNITS = 256
# Train-ийн 20% дээр 1e-3…3-ыг харьцуулсан: 0.1 хамгийн сайн (mean AP 0.29 vs 0.22).
# Цөөн жишээг (хонх 29) цээжлэхээс сэргийлнэ.
L2_PENALTY = 0.1
MAX_EPOCHS = 500
SEED = 0  # Дахин ажиллуулахад ижил үр дүн
TARGET_PRECISION = 0.95
CV_FOLDS = 5
THRESHOLDS = np.round(np.r_[np.arange(0.30, 0.96, 0.05), 0.97, 0.99], 2)
# Мэдэгдэлгүй бичлэгээс хэдэн хэсэг авах: бүгдийг нь авбал сургалт ~10 дахин удаан.
MAX_QUIET_WINDOWS = 2

logger = logging.getLogger("train")


def balance(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Цөөн ангиллыг давтана. Үгүй бол загвар «other» гэж л хариулж сурна (хонх 29 vs other 10 000)."""
    labels, counts = np.unique(y, return_counts=True)
    largest = counts.max()
    picked = np.concatenate([np.resize(np.flatnonzero(y == label), largest) for label in labels])
    return x[picked], y[picked]


def training_windows(data: np.lib.npyio.NpzFile) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """FSD50K-ийн шошго бүхэл бичлэгт: 13 сек хонхны бичлэгийн ихэнх хэсэгт хонх дуугардаггүй.

    Мэдэгдлийн бичлэгээс YAMNet-ийн тухайн ангиллын (LABEL_MAP) оноо хамгийн өндөр хэсгийг л авна.
    """
    names = yamnet_names(str(YAMNET))
    columns = {
        label: YAMNET_CLASSES + np.array([i for i, name in enumerate(names) if LABEL_MAP.get(name) == label])
        for label in ALERTS
    }
    # NpzFile нь data["X"] бүрт файлаас дахин задалдаг: давталтаас өмнө нэг удаа уншина.
    x, clip, labels, split = data["X"], data["clip"], data["label"], data["split"]
    keep = []
    for windows in np.split(np.arange(len(clip)), np.flatnonzero(np.diff(clip)) + 1):
        label = labels[clip[windows[0]]]
        if split[clip[windows[0]]] != "train":
            continue
        if label in columns:
            keep.append(windows[[x[windows][:, columns[label]].max(axis=1).argmax()]])
        else:
            spread = (
                np.linspace(0, len(windows) - 1, min(len(windows), MAX_QUIET_WINDOWS)).round().astype(int)
            )
            keep.append(windows[np.unique(spread)])
    rows = np.concatenate(keep)
    return x[rows], labels[clip[rows]], data["group"][clip[rows]]


def train(x: np.ndarray, y: np.ndarray) -> Pipeline:
    mlp = MLPClassifier(
        hidden_layer_sizes=(HIDDEN_UNITS,),
        alpha=L2_PENALTY,
        max_iter=MAX_EPOCHS,
        random_state=SEED,
    )
    return make_pipeline(StandardScaler(), mlp).fit(*balance(x, y))


def out_of_fold_probs(x: np.ndarray, y: np.ndarray, groups: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Бичлэг бүрийг өөрийг нь хараагүй загвараар үнэлнэ: босгыг test-д хүрэлгүй сонгох боломж."""
    classes = np.unique(y)
    probs = np.zeros((len(y), len(classes)))
    for fit_rows, held_rows in GroupKFold(n_splits=CV_FOLDS).split(x, y, groups):
        head = train(x[fit_rows], y[fit_rows])
        probs[np.ix_(held_rows, np.searchsorted(classes, head.classes_))] = head.predict_proba(x[held_rows])
    return probs, classes


def precision(truth: np.ndarray, flagged: np.ndarray) -> float:
    return float((truth & flagged).sum() / flagged.sum()) if flagged.any() else 0.0


def pick_thresholds(probs: np.ndarray, y: np.ndarray, classes: np.ndarray) -> dict[str, float]:
    """Precision ≥95% хангах хамгийн бага босго (recall хамгийн их). Хангахгүй бол хамгийн өндөр.

    F1 босгыг туршсан: recall бага зэрэг өссөн ч худал мэдэгдэл 5.5 → 13.3/цаг. Худал мэдэгдэл түрүүлнэ.
    """
    chosen = {}
    for label in (label for label in ALERTS if label in classes):
        column = probs[:, np.flatnonzero(classes == label)[0]]
        passing = [t for t in THRESHOLDS if precision(y == label, column >= t) >= TARGET_PRECISION]
        chosen[label] = float(passing[0] if passing else THRESHOLDS[-1])
    return chosen


def export_json(head: Pipeline, thresholds: dict[str, float]) -> None:
    scaler, mlp = head[0], head[-1]
    weights = {
        "features": "yamnet521 mean + max",
        "classes": mlp.classes_.tolist(),
        "thresholds": thresholds,
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "activation": mlp.activation,
        "coefs": [layer.tolist() for layer in mlp.coefs_],
        "intercepts": [layer.tolist() for layer in mlp.intercepts_],
    }
    HEAD_JSON.write_text(json.dumps(weights))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    data = np.load(FEATURES)
    x, y, groups = training_windows(data)
    logger.info("Сургалтын хэсэг: %s", dict(zip(*np.unique(y, return_counts=True), strict=True)))
    probs, classes = out_of_fold_probs(x, y, groups)
    thresholds = pick_thresholds(probs, y, classes)
    logger.info("Босго (train CV): %s", thresholds)

    head = train(x, y)
    joblib.dump(head, HEAD)
    export_json(head, thresholds)
    # Сервер sklearn-гүй numpy-гаар тооцдог: JSON-оос ачаалсан хариу sklearn-тэй яг таарах ёстой.
    # float64: sklearn float32 оролтыг float32-оор тооцож ~4e-6 зөрдөг, сервер float64 ашигладаг.
    x64 = data["X"].astype(np.float64)
    served = SoundHead(str(HEAD_JSON)).probabilities(x64)
    assert np.allclose(served, head.predict_proba(x64), atol=1e-9), "JSON толгой sklearn-ээс зөрлөө"
    logger.info("→ %s, %s (сервертэй тооцоо таарч байна)", HEAD.name, HEAD_JSON.name)


if __name__ == "__main__":
    main()
