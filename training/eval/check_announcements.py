"""announcements.csv-ийн мөр бүрийг серверийн парсераар уншуулж, хүлээгдэж буй хариутай тулгана.

    python training/eval/check_announcements.py

Загвар (make_announcements.py) засах бүрт ажиллуулна. Таарахгүй мөр байвал жагсааж, 1 буцаана.
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


def problem(row: dict[str, str]) -> str | None:
    if row["kind"] == "name":
        return None if name_mentioned(row["text"], row["name"]) else f"нэр «{row['name']}» олдсонгүй"
    call = parse_queue_call(row["text"])
    ticket = parse_ticket(row["ticket"])
    if ticket is None or not queue_matches(call, ticket) or call.letter != ticket.letter:
        return f"дугаар {row['ticket']} ≠ {call.letter}-{call.number}"
    # Парсер зөвхөн «цонх»-ыг таньдаг. «өрөө», «кабинет» дээр window хоосон байх ёстой.
    expected = int(row["window"]) if row["place"] == "цонх" else None
    if call.window != expected:
        return f"цонх {expected} ≠ {call.window}"
    return None


def main() -> int:
    with (HERE / "announcements.csv").open(encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    problems = [(row["id"], row["text"], p) for row in rows if (p := problem(row))]
    for row_id, text, message in problems:
        log.error("%s: %s — %s", row_id, message, text)
    log.info("%d/%d мөр зөв", len(rows) - len(problems), len(rows))
    return 1 if problems else 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    sys.exit(main())
