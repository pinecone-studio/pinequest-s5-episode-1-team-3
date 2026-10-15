from conftest import FakeClassifier, FakeTranscriber

from app.models.sound import pick_heard, pick_label
from app.pipeline import run_detection
from app.schemas import HeardSound, SoundResult


def test_home_uses_only_sound(silence):
    classifier = FakeClassifier(SoundResult(label="doorbell", score=0.7))
    result = run_detection(silence, "home", classifier, FakeTranscriber("x"))
    assert result.sound is not None and result.sound.label == "doorbell"
    assert result.transcript is None


def test_queue_without_letter_matches(silence):
    transcriber = FakeTranscriber("хорин дөрөв дугаартай үйлчлүүлэгч тавдугаар цонхонд ирнэ үү")
    result = run_detection(silence, "queue", FakeClassifier(), transcriber, ticket="24")
    assert result.match is not None
    assert (result.match.value, result.match.window) == ("24", 5)


def test_name_match(silence):
    result = run_detection(silence, "name", FakeClassifier(), FakeTranscriber("Болдоо, нааш ир"), name="Болд")
    assert result.match is not None and result.match.type == "name"


def test_talk_returns_transcript_only(silence):
    result = run_detection(silence, "talk", FakeClassifier(), FakeTranscriber("Та дугаараа хэлнэ үү"))
    assert result.transcript == "Та дугаараа хэлнэ үү"
    assert result.match is None


def test_silence_gives_no_transcript(silence):
    result = run_detection(silence, "queue", FakeClassifier(), FakeTranscriber(""), ticket="А-024")
    assert result.transcript is None and result.match is None


def test_pick_label_maps_yamnet_names():
    assert pick_label({"Knock": 0.6, "Speech": 0.4}, 0.3) == SoundResult(label="knock", score=0.6)
    assert pick_label({"Buzzer": 0.5}, 0.3) == SoundResult(label="doorbell", score=0.5)
    assert pick_label({"Music": 0.9}, 0.3) is None
    assert pick_label({"Knock": 0.2}, 0.3) is None


def test_pick_label_prefers_alert_over_louder_speech():
    assert pick_label({"Speech": 0.85, "Doorbell": 0.6}, 0.3) == SoundResult(label="doorbell", score=0.6)
    assert pick_label({"Speech": 0.85}, 0.3) == SoundResult(label="speech", score=0.85)


def test_home_returns_heard_sound(silence):
    classifier = FakeClassifier(None, HeardSound(kind="dog", score=0.8))
    result = run_detection(silence, "home", classifier, FakeTranscriber("x"))
    assert result.heard == HeardSound(kind="dog", score=0.8)
    assert result.sound is None


def test_pick_heard_maps_home_sounds_and_speech_does_not_hide_them():
    assert pick_heard({"Bark": 0.6, "Speech": 0.9}, 0.3) == HeardSound(kind="dog", score=0.6)
    assert pick_heard({"Shout": 0.5}, 0.3) == HeardSound(kind="calling", score=0.5)
    assert pick_heard({"Speech": 0.7}, 0.3) == HeardSound(kind="speech", score=0.7)
    assert pick_heard({"Bark": 0.2, "Vehicle": 0.9}, 0.3) is None
