from conftest import FakeClassifier, FakeTranscriber

from app.models.sound import pick_label
from app.pipeline import run_detection
from app.schemas import SoundResult


def test_home_uses_only_sound(silence):
    classifier = FakeClassifier(SoundResult(label="doorbell", score=0.7))
    result = run_detection(silence, "home", classifier, FakeTranscriber("x"))
    assert result.sound is not None and result.sound.label == "doorbell"
    assert result.transcript is None


def test_queue_without_letter_matches(silence):
    transcriber = FakeTranscriber("хорин дөрөв дугаартай үйлчлүүлэгч тавдугаар цонхонд ирнэ үү")
    result = run_detection(silence, "queue", FakeClassifier(), transcriber, ticket="24")
    assert result.match is not None
    assert (result.match.value, result.match.window) == ("024", 5)


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
