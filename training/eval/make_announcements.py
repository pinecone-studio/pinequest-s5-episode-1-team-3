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
MAX_TICKET = 999
LETTER_SHARE = 0.75
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
LETTERS = {"А": "А", "Б": "Бэ", "В": "Вэ", "Г": "Гэ", "Д": "Дэ", "Е": "Е"}

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

    @property
    def label(self) -> str:
        digits = f"{self.number:0{TICKET_DIGITS}d}"
        return f"{self.letter}-{digits}" if self.letter else digits

    def spoken(self, attributive: bool) -> str:
        if self.style == "digits":
            number = " ".join(UNITS[int(d)] for d in f"{self.number:0{TICKET_DIGITS}d}")
        elif self.style == "zero":
            # «тэг хорин дөрөв» = 024. Тасалбар дээр бичигдсэнээр нь уншдаг газар бий.
            zeros = TICKET_DIGITS - len(str(self.number))
            number = " ".join(["тэг"] * zeros + [cardinal(self.number, attributive)])
        else:
            number = cardinal(self.number, attributive)
        return f"{LETTERS[self.letter]} {number}" if self.letter else number


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
        ("{t} дугаартай үйлчлүүлэгч {w} цонхонд ирнэ үү.", "цонх"),
        ("{tn}, {w} цонх.", "цонх"),
        ("{t} дугаартай харилцагч {w} цонхонд хандана уу.", "цонх"),
        ("Дараагийн үйлчлүүлэгч {tn}, {w} цонхонд ирнэ үү.", "цонх"),
        ("{t} дугаартай үйлчлүүлэгч, {w} цонх руу ирнэ үү.", "цонх"),
        ("{t} дугаартай харилцагч {w} цонхонд очно уу.", "цонх"),
        ("{t} дугаар, {w} цонхоор үйлчлүүлнэ үү.", "цонх"),
        ("{t} дугаартай үйлчлүүлэгч касс руу ирнэ үү.", ""),
    ],
    "hospital": [
        ("{t} дугаартай үйлчлүүлэгч {r} тоот өрөөнд орно уу.", "өрөө"),
        ("{tn} дугаар, {r} тоот кабинет.", "кабинет"),
        ("{t} дугаартай өвчтөн бүртгэлийн {w} цонхонд ирнэ үү.", "цонх"),
        ("Дараагийн үйлчлүүлэгч {tn}, {r} тоот өрөөнд орно уу.", "өрөө"),
        ("{t} дугаартай үйлчлүүлэгч эмийн сангийн {w} цонхонд ирнэ үү.", "цонх"),
        ("{t} дугаартай үйлчлүүлэгч шинжилгээний {r} тоот өрөөнд орно уу.", "өрөө"),
    ],
    "gov": [
        ("{t} дугаартай иргэн {w} цонхонд хандана уу.", "цонх"),
        ("{tn}, {w} цонх.", "цонх"),
        ("{t} дугаартай иргэн иргэний бүртгэлийн {w} цонхонд ирнэ үү.", "цонх"),
        ("Дараагийн иргэн {tn}, {w} цонхонд ирнэ үү.", "цонх"),
        ("{t} дугаартай иргэн ХУР-ын лавлагааны {w} цонхонд хандана уу.", "цонх"),
        ("{t} дугаартай үйлчлүүлэгч {w} цонхоор үйлчлүүлнэ үү.", "цонх"),
    ],
}

# {n} — нэр (нэрлэх тийн ялгал, өөрчлөгдөхгүй), {r} — өрөө, {w} — цонх
NAME_TEMPLATES: dict[str, list[QueueTemplate]] = {
    "hospital": [
        ("{n}, {r} тоот өрөөнд орно уу.", "өрөө"),
        ("{n} гэдэг үйлчлүүлэгч эмчийн өрөөнд орно уу.", ""),
        ("Өвчтөн {n}, {r} тоот кабинетад орно уу.", "кабинет"),
        ("{n} гэдэг хүн бүртгэлийн {w} цонхонд ирнэ үү.", "цонх"),
        ("{n}, шинжилгээний хариугаа авна уу.", ""),
    ],
    "gov": [
        ("Иргэн {n}, {w} цонхонд ирнэ үү.", "цонх"),
        ("{n} гэдэг иргэн бичиг баримтаа авна уу.", ""),
        ("{n} гэдэг иргэн {w} цонхонд хандана уу.", "цонх"),
    ],
}


def random_ticket(rng: random.Random) -> Ticket:
    letter = rng.choice(list(LETTERS)) if rng.random() < LETTER_SHARE else None
    style = rng.choices(["words", "zero", "digits"], weights=[6, 3, 1])[0]
    # «тэг»-ээр эхлэх уншлага зөвхөн 100-аас бага дугаарт утгатай.
    small = style == "zero" or rng.random() < SMALL_SHARE
    number = rng.randint(1, 99) if small else rng.randint(1, MAX_TICKET)
    return Ticket(letter, number, style)


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
    ticket = random_ticket(rng) if kind == "queue" else None
    name = rng.choice(NAMES) if kind == "name" else ""
    text, window = fill(template, rng, ticket, name)
    return Row(
        id=f"{domain}_{index:03d}",
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
    rng = random.Random(seed)
    rows: list[Row] = []
    for domain in QUEUE_TEMPLATES:
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
