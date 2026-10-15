import pytest

from app.text.matching import Ticket, name_mentioned, parse_ticket, queue_matches
from app.text.numbers import QueueCall, parse_queue_call


@pytest.mark.parametrize(
    ("raw", "ticket"),
    [
        ("А-024", Ticket("А", 24)),
        ("а 24", Ticket("А", 24)),
        ("024", Ticket(None, 24)),
        ("24", Ticket(None, 24)),
    ],
)
def test_parse_ticket(raw, ticket):
    assert parse_ticket(raw) == ticket


@pytest.mark.parametrize("raw", ["", "абв", "А-12345"])
def test_parse_ticket_rejects_garbage(raw):
    assert parse_ticket(raw) is None


def test_ticket_label_is_number_only():
    assert Ticket("А", 24).label == "24"
    assert Ticket(None, 7).label == "7"


def test_same_number_matches():
    assert queue_matches(parse_queue_call("А тэг хорин дөрөв гуравдугаар цонх"), Ticket(None, 24))


def test_letters_are_ignored():
    # Монголд зарлалд үсэг дууддаггүй: Whisper «бай» гэх мэт сонссон ч дугаараар нь таарна.
    assert queue_matches(parse_queue_call("Бэ тэг хорин дөрөв гуравдугаар цонх"), Ticket("А", 24))
    assert queue_matches(parse_queue_call("бай хорин дөрвөн дугаартай үйлчлүүлэгч"), Ticket(None, 24))


@pytest.mark.parametrize("text", ["тэг нэг тав дугаартай үйлчлүүлэгч", "арван тав дугаартай үйлчлүүлэгч"])
def test_leading_zero_and_words_match_same_ticket(text):
    assert queue_matches(parse_queue_call(text), Ticket(None, 15))


def test_ticket_without_letter_matches_any_letter():
    assert queue_matches(parse_queue_call("А тэг хорин дөрөв"), Ticket(None, 24))
    assert queue_matches(parse_queue_call("хорин дөрөв"), Ticket(None, 24))


def test_other_number_does_not_match():
    assert not queue_matches(QueueCall("А", 25, 3), Ticket("А", 24))
    assert not queue_matches(QueueCall(None, None, 3), Ticket("А", 24))


@pytest.mark.parametrize("text", ["Болдоо, нааш ир", "Болдыг дуудаж байна", "болд аа", "Bold, bold."])
def test_name_mentioned(text):
    assert name_mentioned(text, "Болд")


@pytest.mark.parametrize("text", ["Бат-Эрдэнэ нааш ир", "батэрдэнээ ороорой", "Бат Эрдэнэ", "Bat-Erdene"])
def test_hyphenated_name_mentioned(text):
    assert name_mentioned(text, "Бат-Эрдэнэ")


def test_hyphenated_name_needs_every_part():
    assert not name_mentioned("Бат ирлээ", "Бат-Эрдэнэ")


@pytest.mark.parametrize("text", ["энэ бол сайхан", "болт авчир", "", "bolt"])
def test_name_not_mentioned(text):
    assert not name_mentioned(text, "Болд")


@pytest.mark.parametrize(
    "text, name",
    [
        ("Сарая, Сарая", "Сараа"),
        ("Khulan ороорой", "Хулан"),
        ("Tsetseg", "Цэцэг"),
        ("Munkh ороорой", "Мөнх"),
        ("Ulzii", "Өлзий"),
    ],
)
def test_name_heard_with_different_spelling(text, name):
    # ElevenLabs нэрийг латинаар эсвэл я/й-г сольж бичдэг.
    assert name_mentioned(text, name)
