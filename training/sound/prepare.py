"""Алхам 2-3: татсан бичлэгийг манай 5 ангилал руу хөрвүүлж, 16kHz mono болгоно.

Гаралт (Git-д орохгүй):
    data/16k/<эх>/…wav   16kHz mono бичлэг
    data/manifest.csv    name, label, group, split

Ажиллуулах: .venv/bin/python prepare.py
"""

import csv
import json
import logging
import sys
import wave
import zlib
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "server"))
# Серверийн аудио уншилтыг яг адилхан ашиглана: сургалт, сервер хоёр нэг дууг ижил сонсоно.
from app.audio import SAMPLE_RATE, AudioError, decode  # noqa: E402

DATA = Path(__file__).resolve().parent / "data"
ESC50 = DATA / "raw" / "esc50" / "ESC-50-master"
FSD50K = DATA / "raw" / "fsd50k"
OUT = DATA / "16k"
MANIFEST = DATA / "manifest.csv"

# ESC-50-д хонх, яриа байхгүй (FSD50K-ээс авна). Бусад 48 ангилал (сирен, сүмийн хонх …) → other.
ESC50_LABELS = {"door_wood_knock": "knock", "clock_alarm": "alarm"}
ESC50_TEST_FOLD = "5"
FSD50K_TEST_PERCENT = 20
# FSD50K-ийн шошго эх ангилал руу дамждаг: «Alarm» дотор утас, сирен, машины дохио, хаалганы хонх ч бий.
NOT_HOME_ALARM = frozenset(
    {
        "Doorbell",
        "Siren",
        "Telephone",
        "Ringtone",
        "Vehicle_horn_and_car_horn_and_honking",
        "Bicycle_bell",
        "Vehicle",
    }
)
PCM_MAX = 32_767

logger = logging.getLogger("prepare")


@dataclass(frozen=True)
class Clip:
    source: Path
    name: str  # data/16k/ доторх зам
    label: str
    group: str  # Freesound ID: train/test-ийг үүгээр хуваана (хоёр санд ижил)
    split: str


def esc50_clips() -> list[Clip]:
    with (ESC50 / "meta" / "esc50.csv").open(newline="") as meta:
        rows = list(csv.DictReader(meta))
    # Цөөн эх бичлэг хоёр fold-д тархсан (жишээ нь 209698: clock_alarm fold 4, clock_tick fold 5).
    # Тиймээс fold-оор биш, эх бичлэгээр нь хуваана.
    test_sources = {row["src_file"] for row in rows if row["fold"] == ESC50_TEST_FOLD}
    return [
        Clip(
            source=ESC50 / "audio" / row["filename"],
            name=f"esc50/{row['filename']}",
            label=ESC50_LABELS.get(row["category"], "other"),
            group=f"fs-{row['src_file']}",
            split="test" if row["src_file"] in test_sources else "train",
        )
        for row in rows
    ]


def fsd50k_label(labels: set[str]) -> str:
    """Мэдэгдэх дуу ярианаас түрүүлнэ (серверийн pick_label-тай ижил дараалал)."""
    if "Doorbell" in labels:
        return "doorbell"
    if "Knock" in labels:
        return "knock"
    if "Alarm" in labels and not labels & NOT_HOME_ALARM:
        return "alarm"
    return "speech" if "Speech" in labels else "other"


def hashed_split(group: str) -> str:
    # Санамсаргүй мэт боловч ажиллуулах бүрт ижил.
    return "test" if zlib.crc32(group.encode()) % 100 < FSD50K_TEST_PERCENT else "train"


def fsd50k_clips(skip: set[str]) -> list[Clip]:
    """skip: ESC-50-д аль хэдийн байгаа Freesound бичлэг (152). Ижил дууг хоёр удаа оруулахгүй."""
    audio = FSD50K / "FSD50K.eval_audio"
    if not audio.exists():
        logger.warning("FSD50K алга (%s), зөвхөн ESC-50", audio.relative_to(DATA))
        return []
    with (FSD50K / "FSD50K.ground_truth" / "eval.csv").open(newline="") as meta:
        rows = [row for row in csv.DictReader(meta) if f"fs-{row['fname']}" not in skip]
    info = json.loads((FSD50K / "FSD50K.metadata" / "eval_clips_info_FSD50K.json").read_text())
    clips = []
    for row in rows:
        # Нэг хүн ижил хонхоо олон удаа бичиж оруулдаг: хүнээр нь бүлэглэнэ.
        group = f"up-{info[row['fname']]['uploader']}"
        clips.append(
            Clip(
                source=audio / f"{row['fname']}.wav",
                name=f"fsd50k/{row['fname']}.wav",
                label=fsd50k_label(set(row["labels"].split(","))),
                group=group,
                split=hashed_split(group),
            )
        )
    return clips


def write_wav(path: Path, samples: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(samples, -1.0, 1.0) * PCM_MAX).astype(np.int16)
    partial = path.with_suffix(".part")
    with wave.open(str(partial), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        out.writeframes(pcm.tobytes())
    # Тасарсан ажиллагаа хагас файл үлдээвэл дараагийн удаа «бэлэн» гэж андуурахгүй.
    partial.rename(path)


def convert(clips: list[Clip]) -> list[Clip]:
    kept: list[Clip] = []
    for clip in clips:
        target = OUT / clip.name
        if not target.exists():
            try:
                write_wav(target, decode(clip.source.read_bytes()))
            except AudioError:
                logger.warning("Уншиж чадсангүй, алгаслаа: %s", clip.source)
                continue
        kept.append(clip)
    return kept


def check_split(clips: list[Clip]) -> None:
    splits: dict[str, set[str]] = {}
    for clip in clips:
        splits.setdefault(clip.group, set()).add(clip.split)
    leaked = [group for group, found in splits.items() if len(found) > 1]
    assert not leaked, f"Нэг эх бичлэг train, test хоёуланд орсон: {leaked[:5]}"


def write_manifest(clips: list[Clip]) -> None:
    with MANIFEST.open("w", newline="") as out:
        writer = csv.writer(out)
        writer.writerow(["name", "label", "group", "split"])
        writer.writerows([clip.name, clip.label, clip.group, clip.split] for clip in clips)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    esc50 = esc50_clips()
    clips = convert(esc50 + fsd50k_clips({clip.group for clip in esc50}))
    check_split(clips)
    write_manifest(clips)
    counts = Counter((clip.label, clip.split) for clip in clips)
    logger.info("%-9s %6s %6s", "ангилал", "train", "test")
    for label in sorted({clip.label for clip in clips}):
        logger.info("%-9s %6d %6d", label, counts[label, "train"], counts[label, "test"])
    logger.info("Нийт %d бичлэг → %s", len(clips), MANIFEST.relative_to(ROOT))


if __name__ == "__main__":
    main()
