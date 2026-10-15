"""FSD50K-ийн хэрэгтэй бичлэгийг л татна: eval бүтнээр, dev-ээс prepare.dev_selection().

Zenodo-ийн 30GB zip-ийг бүтнээр татахгүй: HF Hub-ийн толь (Fhrozen/FSD50k) файл бүрийг тусад нь өгдөг.
Шошго, metadata-г Zenodo-оос (README) задалсан байх ёстой. Тасарвал дахин ажиллуулахад үргэлжилнэ.

Ажиллуулах: .venv/bin/python download_fsd50k.py
"""

import csv
import logging
import shutil
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen

from prepare import FSD50K, dev_selection

MIRROR = "https://huggingface.co/datasets/Fhrozen/FSD50k/resolve/main/clips"
WORKERS = 16
TIMEOUT_SECONDS = 60
PROGRESS_EVERY = 500

logger = logging.getLogger("download")


def fetch(split: str, fname: str) -> bool:
    target = FSD50K / f"FSD50K.{split}_audio" / f"{fname}.wav"
    if target.exists():
        return True
    partial = target.with_suffix(".part")
    try:
        with (
            urlopen(f"{MIRROR}/{split}/{fname}.wav", timeout=TIMEOUT_SECONDS) as response,
            partial.open("wb") as out,
        ):
            shutil.copyfileobj(response, out)
    except OSError:
        logger.warning("Татаж чадсангүй: %s/%s", split, fname)
        partial.unlink(missing_ok=True)
        return False
    # Тасарсан татлага хагас файл үлдээвэл prepare.py «бэлэн» гэж андуурахгүй.
    partial.rename(target)
    return True


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with (FSD50K / "FSD50K.ground_truth" / "eval.csv").open(newline="") as meta:
        jobs = [("eval", row["fname"]) for row in csv.DictReader(meta)]
    jobs += [("dev", row["fname"]) for row in dev_selection()]
    for split in ("eval", "dev"):
        (FSD50K / f"FSD50K.{split}_audio").mkdir(parents=True, exist_ok=True)
    failed = 0
    with ThreadPoolExecutor(WORKERS) as pool:
        for i, ok in enumerate(pool.map(lambda job: fetch(*job), jobs), start=1):
            failed += not ok
            if i % PROGRESS_EVERY == 0:
                logger.info("%d / %d", i, len(jobs))
    logger.info("Дууссан: %d бичлэг, %d алдаа", len(jobs), failed)


if __name__ == "__main__":
    main()
