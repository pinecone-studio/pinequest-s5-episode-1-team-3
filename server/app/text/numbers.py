"""Монгол зарлалаас дарааллын дугаар, цонхыг ялгах. Цэвэр функц (файл, сүлжээ, загвар ашиглахгүй).

Жишээ:
    «А тэг хорин дөрөв, гуравдугаар цонх» → А, 24, цонх 3
    «нэг тэг тав»                          → 105 (цифр цифрээр уншсан)
    «А-024 3-р цонх» (Whisper цифрээр бичвэл) → А, 24, цонх 3
"""

from __future__ import annotations

import re
from dataclasses import dataclass, replace

UNITS: dict[str, int] = {
    "тэг": 0,
    "нэг": 1, "нэгэн": 1,
    "хоёр": 2, "хоёрон": 2,
    "гурав": 3, "гурван": 3,
    "дөрөв": 4, "дөрвөн": 4,
    "тав": 5, "таван": 5,
    "зургаа": 6, "зургаан": 6,
    "долоо": 7, "долоон": 7, "дол": 7,
    "найм": 8, "найман": 8,
    "ес": 9, "есөн": 9,
}  # fmt: skip

TENS: dict[str, int] = {
    "арав": 10, "арван": 10,
    "хорь": 20, "хорин": 20,
    "гуч": 30, "гучин": 30,
    "дөч": 40, "дөчин": 40,
    "тавь": 50, "тавин": 50,
    "жар": 60, "жаран": 60,
    "дал": 70, "далан": 70,
    "ная": 80, "наян": 80,
    "ер": 90, "ерэн": 90,
}  # fmt: skip

MULTIPLIERS: dict[str, int] = {"зуу": 100, "зуун": 100, "мянга": 1000, "мянган": 1000}
TEN_VALUES = frozenset(TENS.values())

ORDINAL_SUFFIX = re.compile(r"(дугаар|дүгээр|дахь|дэх)$")
# «3-р цонх», «3 дугаар цонх» — тусдаа бичигдсэн дэс дугаарын нөхцөл
ORDINAL_WORDS = frozenset({"р", "дугаар", "дүгээр", "дахь", "дэх"})
WINDOW_WORD = re.compile(r"^цонх")
BREAKS = frozenset(",.;!?")

# Дарааллын тасалбарын үсгийг уншдаг хэлбэр: «бэ» → Б. Whisper латинаар бичиж ч болно.
LETTER_NAMES: dict[str, str] = {
    "а": "А", "бэ": "Б", "б": "Б", "вэ": "В", "в": "В",
    "гэ": "Г", "г": "Г", "дэ": "Д", "д": "Д", "е": "Е", "йе": "Е",
    "a": "А", "b": "Б", "v": "В", "g": "Г", "d": "Д", "e": "Е",
}  # fmt: skip


@dataclass(frozen=True)
class Token:
    text: str
    value: int | None
    ordinal: bool
    break_before: bool


@dataclass(frozen=True)
class NumberGroup:
    start: int
    end: int  # дараагийн токены индекс
    value: int


@dataclass(frozen=True)
class QueueCall:
    letter: str | None
    number: int | None
    window: int | None


def word_value(word: str) -> int | None:
    """Нэг үгийн тоон утга. Тоо биш бол None."""
    if word.isdigit():
        return int(word)
    stem = ORDINAL_SUFFIX.sub("", word)
    for table in (UNITS, TENS, MULTIPLIERS):
        if stem in table:
            return table[stem]
    return None


def tokenize(text: str) -> list[Token]:
    tokens: list[Token] = []
    pending_break = False
    pieces = re.findall(r"[а-яөүёa-z]+|\d+|[,.;!?]", text.lower())
    for i, piece in enumerate(pieces):
        if piece in BREAKS:
            pending_break = True
            continue
        previous = tokens[-1] if tokens else None
        if piece in ORDINAL_WORDS and previous and previous.value is not None:
            # «3-р цонх» → цонх 3. Харин «нэг тэг тав дугаар» дахь «дугаар» нь «тоо» гэсэн утгатай.
            next_piece = pieces[i + 1] if i + 1 < len(pieces) else ""
            if WINDOW_WORD.match(next_piece):
                tokens[-1] = replace(previous, ordinal=True)
            continue
        value = word_value(piece)
        ordinal = value is not None and not piece.isdigit() and ORDINAL_SUFFIX.search(piece) is not None
        tokens.append(Token(piece, value, ordinal, pending_break))
        pending_break = False
    return tokens


def starts_new_number(previous: Token, current: Token) -> bool:
    """Өмнөх тоон үгтэй нийлэхгүй, шинэ тоо эхэлж байна уу."""
    if previous.ordinal or current.break_before:
        return True
    if previous.text.isdigit() or current.text.isdigit():
        return True
    assert previous.value is not None and current.value is not None
    # «дөрөв гуравдугаар» = 4, 3-р (харин «арван гуравдугаар» = 13-р)
    if current.ordinal and previous.value < 10:
        return True
    # Аравт нь нэгж, аравтын дараа ирдэггүй: «гучин нэг арван» = 31, 10.
    # «тэг хорин дөрөв» (024) — эхний «тэг» тоог тасалдаггүй.
    return current.value in TEN_VALUES and 0 < previous.value < 100


def combine(values: list[int]) -> int:
    if len(values) > 1 and all(v < 10 for v in values):
        return int("".join(str(v) for v in values))  # «нэг тэг тав» → 105
    total, current = 0, 0
    for value in values:
        if value in (100, 1000):
            total += max(current, 1) * value
            current = 0
        else:
            current += value
    return total + current


def number_groups(tokens: list[Token]) -> list[NumberGroup]:
    groups: list[NumberGroup] = []
    i = 0
    while i < len(tokens):
        if tokens[i].value is None:
            i += 1
            continue
        start, values = i, [tokens[i].value or 0]
        i += 1
        while (
            i < len(tokens)
            and tokens[i].value is not None
            and not starts_new_number(tokens[i - 1], tokens[i])
        ):
            values.append(tokens[i].value or 0)
            i += 1
        groups.append(NumberGroup(start, i, combine(values)))
    return groups


def _is_window(tokens: list[Token], group: NumberGroup) -> bool:
    after = group.end < len(tokens) and WINDOW_WORD.match(tokens[group.end].text) is not None
    before = group.start > 0 and WINDOW_WORD.match(tokens[group.start - 1].text) is not None
    return after or before


def parse_queue_call(text: str) -> QueueCall:
    """Зарлалаас тасалбарын үсэг, дугаар, очих цонхыг ялгана."""
    tokens = tokenize(text)
    window: int | None = None
    ticket: NumberGroup | None = None
    for group in number_groups(tokens):
        if window is None and _is_window(tokens, group):
            window = group.value
        elif ticket is None:
            ticket = group
    if ticket is None:
        return QueueCall(letter=None, number=None, window=window)
    letter = LETTER_NAMES.get(tokens[ticket.start - 1].text) if ticket.start > 0 else None
    return QueueCall(letter=letter, number=ticket.value, window=window)
