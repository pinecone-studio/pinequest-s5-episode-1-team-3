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


def test_ticket_label():
    assert Ticket("А", 24).label == "А-024"
    assert Ticket(None, 7).label == "007"


def test_same_letter_and_number_matches():
    assert queue_matches(parse_queue_call("А тэг хорин дөрөв гуравдугаар цонх"), Ticket("А", 24))


def test_other_letter_does_not_match():
    assert not queue_matches(parse_queue_call("Бэ тэг хорин дөрөв гуравдугаар цонх"), Ticket("А", 24))


def test_ticket_without_letter_matches_any_letter():
    assert queue_matches(parse_queue_call("А тэг хорин дөрөв"), Ticket(None, 24))
    assert queue_matches(parse_queue_call("хорин дөрөв"), Ticket(None, 24))


def test_other_number_does_not_match():
    assert not queue_matches(QueueCall("А", 25, 3), Ticket("А", 24))
    assert not queue_matches(QueueCall(None, None, 3), Ticket("А", 24))


@pytest.mark.parametrize("text", ["Болдоо, нааш ир", "Болдыг дуудаж байна", "болд аа"])
def test_name_mentioned(text):
    assert name_mentioned(text, "Болд")


@pytest.mark.parametrize("text", ["энэ бол сайхан", "болт авчир", ""])
def test_name_not_mentioned(text):
    assert not name_mentioned(text, "Болд")
