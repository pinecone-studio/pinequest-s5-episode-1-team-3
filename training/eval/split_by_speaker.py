"""Бичлэгийн жагсаалтыг хүнээр нь train/test болгож хуваана. Алдаа олбол юу ч бичихгүй зогсоно.

    python training/eval/split_by_speaker.py data/manifest.csv data/

manifest.csv: path,speaker,prompt_id   (жишээ: speaker_03/bank_001.m4a,speaker_03,bank_001)
Гаралт:       data/train.csv, data/test.csv  (path,speaker,prompt_id,text)

Шалгах зүйл:
- speaker нь speakers.json-д байгаа
- тестийн хүн зөвхөн test, сургалтын хүн зөвхөн train мөр уншсан (бичвэр ч давхцахгүй)
- нэг хүн нэг мөрийг хоёр удаа уншаагүй
"""

from __future__ import annotations

import csv
import json
import logging
import sys
from pathlib import Path

HERE = Path(__file__).parent
FIELDS = ["path", "speaker", "prompt_id", "text"]
USAGE = "python training/eval/split_by_speaker.py <manifest.csv> <гаралтын хавтас>"

log = logging.getLogger(__name__)


def load_roles() -> dict[str, str]:
    speakers = json.loads((HERE / "speakers.json").read_text(encoding="utf-8"))
    roles = {speaker: "train" for speaker in speakers["train"]}
    overlap = roles.keys() & set(speakers["test"])
    if overlap:
        raise ValueError(f"speakers.json: {sorted(overlap)} train, test хоёуланд байна")
    return roles | {speaker: "test" for speaker in speakers["test"]}


def load_prompts() -> dict[str, dict[str, str]]:
    with (HERE / "announcements.csv").open(encoding="utf-8") as file:
        return {row["id"]: row for row in csv.DictReader(file)}


def check(rows: list[dict[str, str]], roles: dict[str, str], prompts: dict[str, dict[str, str]]) -> list[str]:
    errors: list[str] = []
    seen: set[tuple[str, str]] = set()
    for line, row in enumerate(rows, start=2):
        speaker, prompt_id = row["speaker"], row["prompt_id"]
        role = roles.get(speaker)
        prompt = prompts.get(prompt_id)
        if role is None:
            errors.append(f"{line}: {speaker} speakers.json-д алга")
        elif prompt is None:
            errors.append(f"{line}: {prompt_id} announcements.csv-д алга")
        elif prompt["split"] != role:
            errors.append(f"{line}: {speaker} ({role}) нь {prompt['split']} мөр {prompt_id}-г уншсан")
        if (speaker, prompt_id) in seen:
            errors.append(f"{line}: {speaker} {prompt_id}-г давхар уншсан")
        seen.add((speaker, prompt_id))
    return errors


def write(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def main(manifest: Path, out_dir: Path) -> int:
    roles, prompts = load_roles(), load_prompts()
    with manifest.open(encoding="utf-8") as file:
        rows = list(csv.DictReader(file))
    errors = check(rows, roles, prompts)
    if errors:
        log.error("%d алдаа:\n%s", len(errors), "\n".join(errors))
        return 1
    out_dir.mkdir(parents=True, exist_ok=True)
    for split in ("train", "test"):
        selected = [
            {**row, "text": prompts[row["prompt_id"]]["text"]}
            for row in rows
            if roles[row["speaker"]] == split
        ]
        write(out_dir / f"{split}.csv", [{key: row[key] for key in FIELDS} for row in selected])
        log.info("%s.csv: %d бичлэг", split, len(selected))
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if len(sys.argv) != 3:
        log.error(USAGE)
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1]), Path(sys.argv[2])))
