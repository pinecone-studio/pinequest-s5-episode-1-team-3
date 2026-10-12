"""announcements.csv-ийн мөр бүрийг серверийн парсераар уншуулж, хүлээгдэж буй хариутай тулгана.

    python training/eval/check_announcements.py

Загвар (make_announcements.py) засах бүрт ажиллуулна. Таарахгүй мөр байвал жагсааж, 1 буцаана.
Парсер үсгийг танихгүй ч дугаараар нь таардаг мөрийг анхааруулгаар харуулна.
Энэ нь бичвэр зөв эсэхийг биш, апп тухайн зарлал дээр зөв мэдэгдэл гаргах эсэхийг шалгана.
"""

from __future__ import annotations

import csv
import logging
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parents[1] / "server"))

from app.text.matching import name_mentioned, parse_ticket, queue_matches  # noqa: E402
from app.text.numbers import parse_queue_call  # noqa: E402

log = logging.getLogger(__name__)


def check(row: dict[str, str]) -> tuple[str | None, str | None]:
    """(алдаа, анхааруулга). Алдаа = апп буруу мэдэгдэл гаргана эсвэл гаргахгүй."""
    if row["kind"] == "name":
        found = name_mentioned(row["text"], row["name"])
        return (None if found else f"нэр «{row['name']}» олдсонгүй"), None
    call = parse_queue_call(row["text"])
    ticket = parse_ticket(row["ticket"])
    if ticket is None or not queue_matches(call, ticket):
        return f"дугаар {row['ticket']} ≠ {call.letter}-{call.number}", None
    # Парсер зөвхөн «цонх»-ыг таньдаг. «өрөө», «кабинет» дээр window хоосон байх ёстой.
    expected = int(row["window"]) if row["place"] == "цонх" else None
    if call.window != expected:
        return f"цонх {expected} ≠ {call.window}", None
    if ticket.letter and call.letter is None:
        # Мэдэгдэл гарна, гэхдээ зөвхөн тоогоор тулгана: B-024, C-024 хоёрыг ялгахгүй.
        return None, f"парсер {row['ticket']}-ийн үсгийг танихгүй"
    return None, None


def main() -> int:
    with (HERE / "announcements.csv").open(encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    errors: list[str] = []
    warnings: list[str] = []
    for row in rows:
        error, warning = check(row)
        if error:
            errors.append(f"{row['id']}: {error} — {row['text']}")
        if warning:
            warnings.append(f"{row['id']}: {warning}")
    for line in errors:
        log.error("%s", line)
    if warnings:
        log.warning("Анхааруулга (%d):\n%s", len(warnings), "\n".join(warnings))
    log.info("%d/%d мөр зөв, %d анхааруулга", len(rows) - len(errors), len(rows), len(warnings))
    return 1 if errors else 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.exit(main())
