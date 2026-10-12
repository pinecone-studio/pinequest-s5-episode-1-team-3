"""Зарлал хэрэглэгчийнх мөн эсэхийг шалгах. Цэвэр функц (файл, сүлжээ, загвар ашиглахгүй)."""

from __future__ import annotations

import re
from dataclasses import dataclass
from difflib import SequenceMatcher

from app.text.numbers import LETTER_NAMES, QueueCall

NAME_SIMILARITY = 0.8
_WORD = re.compile(r"[а-яөүёa-z]+")
_TICKET = re.compile(r"\s*([а-яёөүa-z]?)\s*[-‐–]?\s*(\d{1,4})\s*")


@dataclass(frozen=True)
class Ticket:
    letter: str | None
    number: int

    @property
    def label(self) -> str:
        digits = f"{self.number:03d}"
        return f"{self.letter}-{digits}" if self.letter else digits


def parse_ticket(raw: str) -> Ticket | None:
    """Хэрэглэгчийн оруулсан тасалбар: «А-024», «а 24», «024», «24» → Ticket."""
    match = _TICKET.fullmatch(raw.lower())
    if match is None:
        return None
    letter_text, digits = match.groups()
    letter = LETTER_NAMES.get(letter_text) if letter_text else None
    if letter_text and letter is None:
        letter = letter_text.upper()
    return Ticket(letter=letter, number=int(digits))


def queue_matches(call: QueueCall, ticket: Ticket) -> bool:
    """Дугаар таарах ёстой. Үсэг нь хоёуланд нь байвал үсэг ч таарах ёстой.

    Зарлалд үсэг сонсогдоогүй бол дугаараар нь л тулгана: ээлжээ алдсанаас
    илүү мэдэгдэл авах нь дээр.
    """
    if call.number is None or call.number != ticket.number:
        return False
    if ticket.letter and call.letter:
        return ticket.letter == call.letter
    return True


def _word_matches(word: str, target: str) -> bool:
    """Нэрээс богино үгийг тооцохгүй («бол» ≠ «Болд»)."""
    if len(word) < len(target):
        return False
    return (
        word.startswith(target)
        or SequenceMatcher(None, word[: len(target)], target).ratio() >= NAME_SIMILARITY
    )


def name_mentioned(transcript: str, name: str) -> bool:
    """«Болдоо», «Болдыг» ≈ «Болд». «Бат-Эрдэнэ» нь «Бат-Эрдэнэ», «Батэрдэнэ» хоёуланд таарна."""
    parts = _WORD.findall(name.lower())
    if not parts:
        return False
    words = _WORD.findall(transcript.lower())
    if any(_word_matches(word, "".join(parts)) for word in words):
        return True
    # Whisper давхар нэрийг тусдаа үг болгож бичдэг: хэсэг бүр сонсогдсон байх ёстой.
    return len(parts) > 1 and all(any(_word_matches(word, part) for word in words) for part in parts)
