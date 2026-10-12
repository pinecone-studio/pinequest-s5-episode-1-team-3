import pytest

from app.text.numbers import QueueCall, combine, parse_queue_call, tokenize, word_value


@pytest.mark.parametrize(
    ("word", "value"),
    [
        ("тэг", 0),
        ("хорин", 20),
        ("дөрөв", 4),
        ("гуравдугаар", 3),
        ("долдугаар", 7),
        ("024", 24),
        ("цонх", None),
    ],
)
def test_word_value(word, value):
    assert word_value(word) == value


@pytest.mark.parametrize(
    ("values", "number"),
    [([0, 20, 4], 24), ([1, 0, 5], 105), ([1, 100, 10, 5], 115), ([2, 100], 200), ([100, 20], 120)],
)
def test_combine(values, number):
    assert combine(values) == number


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("А тэг хорин дөрөв, гуравдугаар цонх", QueueCall("А", 24, 3)),
        ("А тэг хорин дөрөв гуравдугаар цонх", QueueCall("А", 24, 3)),
        ("Бэ нэг зуун арван тав, долдугаар цонх", QueueCall("Б", 115, 7)),
        ("хорин дөрөв дугаартай үйлчлүүлэгч тавдугаар цонхонд ирнэ үү", QueueCall(None, 24, 5)),
        ("нэг тэг тав дугаар", QueueCall(None, 105, None)),
        ("А-024 3-р цонх", QueueCall("А", 24, 3)),
        ("А024, 3 дугаар цонх", QueueCall("А", 24, 3)),
        ("цонх гурав, А тэг хорин дөрөв", QueueCall("А", 24, 3)),
        ("гучин нэг арван гуравдугаар цонх", QueueCall(None, 31, 13)),
        ("дөрөв гуравдугаар цонх", QueueCall(None, 4, 3)),
        ("сайн байна уу", QueueCall(None, None, None)),
    ],
)
def test_parse_queue_call(text, expected):
    assert parse_queue_call(text) == expected


def test_punctuation_breaks_numbers():
    tokens = tokenize("тав, долдугаар")
    assert [t.break_before for t in tokens] == [False, True]
    assert parse_queue_call("тав, долдугаар цонх") == QueueCall(None, 5, 7)
