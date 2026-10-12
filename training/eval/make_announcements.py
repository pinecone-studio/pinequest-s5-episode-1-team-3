"""Бичлэг хийх 300 зарлалын хүснэгт (банк, эмнэлэг, төрийн үйлчилгээ/ХУР) үүсгэнэ.

    python training/eval/make_announcements.py   → training/eval/announcements.csv

Seed тогтмол тул дахин ажиллуулахад яг ижил хүснэгт гарна. Хүснэгтийг гараар засахгүй,
энэ скриптийг засаад дахин үүсгэнэ.

Баганууд:
    id         bank_001 … (бичлэгийн файлын нэр болно: speaker_03/bank_001.m4a)
    domain     bank | hospital | gov
    kind       queue | name
    split      train | test   (test мөрийг зөвхөн тестийн 2 хүн уншина, speakers.json)
    text       Чанга уншиж бичүүлэх бичвэр. Whisper fine-tune-ийн зорилтот бичвэр ч мөн
    ticket     Апп-д оруулах дугаар: «А-024», «024»  (queue)
    window     Очих цонх/өрөөний дугаар, байхгүй бол хоосон
    place      цонх | өрөө | кабинет — window юуны дугаар вэ
    name       Дуудсан нэр (name)
    style      Дугаарыг яаж уншсан: words | zero | digits
"""

from __future__ import annotations

import csv
import logging
import random
from dataclasses import asdict, dataclass
from pathlib import Path

SEED = 20261012
PER_DOMAIN = 100
TEST_PER_DOMAIN = 20
NAME_SHARE = {"bank": 0.0, "hospital": 0.4, "gov": 0.25}
SMALL_SHARE = 0.3
TICKET_DIGITS = 3
MAX_WINDOW = 12
ROOM_RANGE = (101, 420)
OUT = Path(__file__).with_name("announcements.csv")

log = logging.getLogger(__name__)

UNITS = ["тэг", "нэг", "хоёр", "гурав", "дөрөв", "тав", "зургаа", "долоо", "найм", "ес"]
UNITS_ATTR = ["тэг", "нэг", "хоёр", "гурван", "дөрвөн", "таван", "зургаан", "долоон", "найман", "есөн"]
TENS = ["", "арав", "хорь", "гуч", "дөч", "тавь", "жар", "дал", "ная", "ер"]
TENS_ATTR = ["", "арван", "хорин", "гучин", "дөчин", "тавин", "жаран", "далан", "наян", "ерэн"]
BACK_VOWELS = set("аоуя")
FRONT_VOWELS = set("эөүеи")

# Дарааллын тасалбарын үсгийг дууддаг хэлбэр (server/app/text/numbers.py → LETTER_NAMES).
CYRILLIC_LETTERS = {"А": "А", "Б": "Бэ", "В": "Вэ", "Г": "Гэ", "Д": "Дэ", "Е": "Е"}
# Банкууд латин үсэгтэй тасалбар өгч, англиар дууддаг. «A-» нь дугаартайгаа нийлж бичигдэнэ.
BANK_LETTERS = {"A": "A-", "B": "Бий", "C": "Си", "D": "Дий"}


@dataclass(frozen=True)
class TicketRules:
    letters: dict[str, str]  # тасалбарын үсэг → дуудлага
    letter_share: float
    max_number: int
    pad_digits: bool  # цифрээр уншихдаа тэгээр дүүргэх эсэх («тэг нэг найм» эсвэл «нэг найм»)


RULES = {
    "bank": TicketRules(BANK_LETTERS, letter_share=1.0, max_number=150, pad_digits=False),
    "hospital": TicketRules(CYRILLIC_LETTERS, letter_share=0.75, max_number=999, pad_digits=True),
    "gov": TicketRules(CYRILLIC_LETTERS, letter_share=0.75, max_number=999, pad_digits=True),
}

# Багийнхан гараар зассан мөр: (бичвэр, ticket, window, style). Үүсгэсэн мөрийг дарж бичнэ.
FIXED_ROWS: dict[str, tuple[str, str, int, str]] = {
    "bank_001": ("A-тавин найман дугаартай үйлчлүүлэгч есдүгээр цонхонд очно уу.", "A-058", 9, "words"),
    "bank_002": ("Си хоёр дугаартай үйлчлүүлэгч хоёрдугаар цонхонд очно уу.", "C-002", 2, "words"),
    "bank_003": ("Бий тэг ерэн есөн дугаартай үйлчлүүлэгч наймдугаар цонхонд очно уу.", "B-099", 8, "zero"),
    "bank_004": ("Дий найм ес дугаартай үйлчлүүлэгч дөрөвдүгээр цонхонд очно уу.", "D-089", 4, "digits"),
}

NAMES = [
    "Болд", "Бат-Эрдэнэ", "Сарнай", "Наран", "Тэмүүлэн", "Оюунчимэг", "Ганбаатар",
    "Мөнх-Эрдэнэ", "Цэцэг", "Анужин", "Билгүүн", "Номин", "Төгөлдөр", "Хулан", "Батбаяр",
    "Солонго", "Уянга", "Дорж", "Мишээл", "Тэргэл", "Гэрэл", "Ариунаа", "Золбоо",
    "Нямдорж", "Отгонбаяр", "Пүрэвсүрэн", "Хонгор", "Энхжин", "Баярмаа", "Сүхбат",
]  # fmt: skip


def cardinal(n: int, attributive: bool = False) -> str:
    """0–999 → үгээр. attributive: нэр үгийн өмнөх хэлбэр («таван тоот», «хорин дугаартай»)."""
    if n < 10:
        return (UNITS_ATTR if attributive else UNITS)[n]
    words: list[str] = []
    hundreds, rest = divmod(n, 100)
    tens, units = divmod(rest, 10)
    if hundreds:
        # Зуутыг үргэлж нэрийн өмнөх хэлбэрээр: «гурван зуун», зарлалд «нэг зуун» гэж хэлдэг.
        last = rest == 0
        words += [UNITS_ATTR[hundreds], "зуун" if attributive or not last else "зуу"]
    if tens:
        last = units == 0
        words.append(TENS_ATTR[tens] if attributive or not last else TENS[tens])
    if units:
        words.append((UNITS_ATTR if attributive else UNITS)[units])
    return " ".join(words)


def _suffix(word: str) -> str:
    for char in reversed(word):
        if char in BACK_VOWELS:
            return "дугаар"
        if char in FRONT_VOWELS:
            return "дүгээр"
    return "дугаар"


def ordinal(n: int) -> str:
    """3 → «гуравдугаар», 11 → «арван нэгдүгээр»."""
    words = cardinal(n).split()
    words[-1] += _suffix(words[-1])
    return " ".join(words)


@dataclass(frozen=True)
class Ticket:
    letter: str | None
    number: int
    style: str  # words | zero | digits
    letter_word: str
    pad_digits: bool

    @property
    def label(self) -> str:
        digits = f"{self.number:0{TICKET_DIGITS}d}"
        return f"{self.letter}-{digits}" if self.letter else digits

    def spoken(self, attributive: bool) -> str:
        if self.style == "digits":
            digits = f"{self.number:0{TICKET_DIGITS}d}" if self.pad_digits else str(self.number)
            number = " ".join(UNITS[int(d)] for d in digits)
        elif self.style == "zero":
            # «тэг хорин дөрөв» = 024. Тасалбар дээр бичигдсэнээр нь уншдаг газар бий.
            zeros = TICKET_DIGITS - len(str(self.number))
            number = " ".join(["тэг"] * zeros + [cardinal(self.number, attributive)])
        else:
            number = cardinal(self.number, attributive)
        if not self.letter:
            return number
        joiner = "" if self.letter_word.endswith("-") else " "
        return f"{self.letter_word}{joiner}{number}"


@dataclass(frozen=True)
class Row:
    id: str
    domain: str
    kind: str
    split: str
    text: str
    ticket: str
    window: str
    place: str
    name: str
    style: str


QueueTemplate = tuple[str, str]  # (бичвэр, place)

# {t} — дугаар (нэрийн өмнөх хэлбэр), {tn} — дугаар (бие даасан), {w} — дэс тоо, {r} — өрөөний тоо
QUEUE_TEMPLATES: dict[str, list[QueueTemplate]] = {
    "bank": [
        ("{t} дугаартай үйлчлүүлэгч {w} цонхонд очно уу.", "цонх"),
    ],
    "hospital": [
        ("{t} дугаартай үйлчлүүлэгч {w} цонхонд очно уу.", "цонх"),
        ("{t} дугаартай үйлчлүүлэгч {r} өрөөнд орно уу.", "өрөө"),
    ],
    "gov": [
        ("{t} дугаартай үйлчлүүлэгч {w} цонхонд очно уу.", "цонх"),
    ],
}

# {n} — нэр (нэрлэх тийн ялгал, өөрчлөгдөхгүй), {r} — өрөө, {w} — цонх
NAME_TEMPLATES: dict[str, list[QueueTemplate]] = {
    "hospital": [
        ("{n} гэдэг үйлчлүүлэгч {w} цонхонд очно уу.", "цонх"),
        ("{n} гэдэг үйлчлүүлэгч {r} өрөөнд орно уу.", "өрөө"),
    ],
    "gov": [
        ("{n} гэдэг үйлчлүүлэгч {w} цонхонд очно уу.", "цонх"),
    ],
}


def random_ticket(rng: random.Random, rules: TicketRules) -> Ticket:
    letter = rng.choice(list(rules.letters)) if rng.random() < rules.letter_share else None
    style = rng.choices(["words", "zero", "digits"], weights=[6, 3, 1])[0]
    # «тэг»-ээр эхлэх уншлага зөвхөн 100-аас бага дугаарт утгатай.
    small = style == "zero" or rng.random() < SMALL_SHARE
    number = rng.randint(1, 99) if small else rng.randint(1, rules.max_number)
    letter_word = rules.letters[letter] if letter else ""
    return Ticket(letter, number, style, letter_word, rules.pad_digits)


def fill(template: str, rng: random.Random, ticket: Ticket | None, name: str) -> tuple[str, int | None]:
    """Загварыг бөглөөд (бичвэр, цонх/өрөөний дугаар) буцаана."""
    window = rng.randint(1, MAX_WINDOW)
    room = rng.randint(*ROOM_RANGE)
    text = template.format(
        t=ticket.spoken(attributive=True) if ticket else "",
        tn=ticket.spoken(attributive=False) if ticket else "",
        w=ordinal(window),
        r=cardinal(room, attributive=True),
        n=name,
    )
    text = text[0].upper() + text[1:]
    if "{w}" in template:
        return text, window
    return text, room if "{r}" in template else None


def make_row(domain: str, index: int, kind: str, split: str, rng: random.Random) -> Row:
    templates = NAME_TEMPLATES[domain] if kind == "name" else QUEUE_TEMPLATES[domain]
    template, place = rng.choice(templates)
    ticket = random_ticket(rng, RULES[domain]) if kind == "queue" else None
    name = rng.choice(NAMES) if kind == "name" else ""
    text, window = fill(template, rng, ticket, name)
    row_id = f"{domain}_{index:03d}"
    if row_id in FIXED_ROWS:
        text, label, fixed_window, style = FIXED_ROWS[row_id]
        return Row(row_id, domain, kind, split, text, label, str(fixed_window), "цонх", "", style)
    return Row(
        id=row_id,
        domain=domain,
        kind=kind,
        split=split,
        text=text,
        ticket=ticket.label if ticket else "",
        window=str(window) if window is not None else "",
        place=place if window is not None else "",
        name=name,
        style=ticket.style if ticket else "",
    )


def make_rows(seed: int = SEED) -> list[Row]:
    rows: list[Row] = []
    for domain in QUEUE_TEMPLATES:
        # Домэйн бүр тусдаа seed-тэй: банкны загвар засахад эмнэлгийн мөрүүд өөрчлөгдөхгүй.
        rng = random.Random(f"{seed}-{domain}")
        names = round(PER_DOMAIN * NAME_SHARE[domain])
        kinds = ["name"] * names + ["queue"] * (PER_DOMAIN - names)
        rng.shuffle(kinds)
        # Тест нь queue, name хоёрыг хүснэгттэй ижил хувиар агуулна (давхаргалсан сонголт).
        test_ids: set[int] = set()
        for kind in ("queue", "name"):
            ids = [i for i, k in enumerate(kinds) if k == kind]
            test_ids |= set(rng.sample(ids, round(TEST_PER_DOMAIN * len(ids) / PER_DOMAIN)))
        for i, kind in enumerate(kinds):
            split = "test" if i in test_ids else "train"
            rows.append(make_row(domain, i + 1, kind, split, rng))
    return rows


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    rows = make_rows()
    with OUT.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(asdict(rows[0])), lineterminator="\n")
        writer.writeheader()
        writer.writerows(asdict(row) for row in rows)
    test = sum(row.split == "test" for row in rows)
    log.info("%s: %d мөр (train %d, test %d)", OUT.name, len(rows), len(rows) - test, test)


if __name__ == "__main__":
    main()
