"""Алхам 5: YAMNet шинж (features.npz) дээр MLP толгой сургаж, босгыг train дээр сонгоно.

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
from app.models.sound import SoundHead  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
FEATURES = DATA / "features.npz"
HEAD = DATA / "sound_head.joblib"
HEAD_JSON = DATA / "sound_head.json"
ALERTS = ("knock", "doorbell", "alarm")
HIDDEN_UNITS = 256
L2_PENALTY = 1e-3
MAX_EPOCHS = 500
SEED = 0  # Дахин ажиллуулахад ижил үр дүн
TARGET_PRECISION = 0.95
CV_FOLDS = 5
THRESHOLDS = np.round(np.arange(0.30, 1.0, 0.05), 2)

logger = logging.getLogger("train")


def balance(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Цөөн ангиллыг давтана. Үгүй бол загвар «other» гэж л хариулж сурна (хонх 29 vs other 10 000)."""
    labels, counts = np.unique(y, return_counts=True)
    largest = counts.max()
    picked = np.concatenate([np.resize(np.flatnonzero(y == label), largest) for label in labels])
    return x[picked], y[picked]


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
    """Precision ≥95% хангах хамгийн бага босго (recall хамгийн их). Хангахгүй бол хамгийн өндөр."""
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
    rows = data["split"] == "train"
    x, y = data["X"][rows], data["label"][rows]
    probs, classes = out_of_fold_probs(x, y, data["group"][rows])
    thresholds = pick_thresholds(probs, y, classes)
    logger.info("Босго (train CV): %s", thresholds)

    head = train(x, y)
    joblib.dump(head, HEAD)
    export_json(head, thresholds)
    # Сервер sklearn-гүй numpy-гаар тооцдог: JSON-оос ачаалсан хариу sklearn-тэй яг таарах ёстой.
    served = SoundHead(str(HEAD_JSON)).probabilities(data["X"])
    assert np.allclose(served, head.predict_proba(data["X"]), atol=1e-6), "JSON толгой sklearn-ээс зөрлөө"
    logger.info("→ %s, %s (сервертэй тооцоо таарч байна)", HEAD.name, HEAD_JSON.name)


if __name__ == "__main__":
    main()
