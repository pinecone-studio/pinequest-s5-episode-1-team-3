"""Алхам 5: YAMNet шинж (features.npz) дээр MLP толгой сургаж, test дээр хэмжинэ.

Гаралт (Git-д орохгүй):
    data/sound_head.joblib   сервер SOUND_HEAD_MODEL-ээр ачаална
    data/sound_head.json     утсан дээр ажиллуулах жин (scaler + давхаргууд)

Ажиллуулах: .venv/bin/python train.py
"""

import json
import logging
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import classification_report
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler

DATA = Path(__file__).resolve().parent / "data"
FEATURES = DATA / "features.npz"
HEAD = DATA / "sound_head.joblib"
HEAD_JSON = DATA / "sound_head.json"
HIDDEN_UNITS = 256
L2_PENALTY = 1e-3
MAX_EPOCHS = 500
SEED = 0  # Дахин ажиллуулахад ижил үр дүн

logger = logging.getLogger("train")


def balance(x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Цөөн ангиллыг давтана. Үгүй бол загвар «other» гэж л хариулж сурна (knock 32 vs other 1535)."""
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


def export_json(head: Pipeline) -> None:
    scaler, mlp = head[0], head[-1]
    weights = {
        "features": "yamnet521 mean + max",
        "classes": mlp.classes_.tolist(),
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
    train_rows, test_rows = data["split"] == "train", data["split"] == "test"
    head = train(data["X"][train_rows], data["label"][train_rows])
    predicted = head.predict(data["X"][test_rows])
    logger.info(
        "Test (%d бичлэг):\n%s",
        test_rows.sum(),
        classification_report(data["label"][test_rows], predicted, digits=3),
    )
    joblib.dump(head, HEAD)
    export_json(head)
    logger.info("→ %s, %s", HEAD.name, HEAD_JSON.name)


if __name__ == "__main__":
    main()
