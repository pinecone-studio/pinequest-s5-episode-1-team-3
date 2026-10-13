import json

import numpy as np
import pytest

from app.models.sound import SoundHead, head_features
from app.schemas import SoundResult

CLASSES = ["alarm", "knock", "other"]


def make_head(tmp_path, bias=(0.0, 0.0, 0.0), activation="relu", classes=CLASSES):
    # 2 шинж → 2 нуугдмал → гаралт. Гаралтын жин 0 тул магадлалыг зөвхөн bias шийднэ.
    weights = {
        "classes": classes,
        "thresholds": {"alarm": 0.5, "knock": 0.3},
        "mean": [0.0, 0.0],
        "scale": [1.0, 1.0],
        "activation": activation,
        "coefs": [np.eye(2).tolist(), np.zeros((2, len(classes))).tolist()],
        "intercepts": [[0.0, 0.0], list(bias)],
    }
    path = tmp_path / "sound_head.json"
    path.write_text(json.dumps(weights))
    return SoundHead(str(path))


def test_probabilities_are_softmax(tmp_path):
    head = make_head(tmp_path, bias=(0.0, np.log(2), np.log(3)))
    np.testing.assert_allclose(head.probabilities(np.zeros(2)), [1 / 6, 2 / 6, 3 / 6])


def test_alert_needs_its_own_threshold(tmp_path):
    head = make_head(tmp_path)
    assert head.label(np.array([0.6, 0.1, 0.3])) == SoundResult(label="alarm", score=0.6)
    assert head.label(np.array([0.45, 0.1, 0.45])) == SoundResult(label="other", score=0.45)


def test_alert_over_threshold_beats_more_likely_quiet_class(tmp_path):
    head = make_head(tmp_path)
    assert head.label(np.array([0.0, 0.35, 0.65])) == SoundResult(label="knock", score=0.35)


@pytest.mark.parametrize(("activation", "classes"), [("tanh", CLASSES), ("relu", ["knock", "other"])])
def test_rejects_heads_it_cannot_compute(tmp_path, activation, classes):
    with pytest.raises(ValueError):
        make_head(tmp_path, bias=(0.0,) * len(classes), activation=activation, classes=classes)


def test_head_features_are_mean_then_max():
    scores = np.zeros((2, 521), dtype=np.float32)
    scores[0, 353], scores[1, 353] = 0.2, 0.8
    features = head_features(scores)
    assert features.shape == (1042,)
    assert features[353] == pytest.approx(0.5)
    assert features[521 + 353] == pytest.approx(0.8)
