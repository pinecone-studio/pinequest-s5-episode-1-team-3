"""Монгол Whisper-ийг faster-whisper (CTranslate2) формат руу хөрвүүлнэ: сервер WHISPER_MODEL-ээр ачаална.

Эх загвар: bayartsogt/whisper-small-mn-8 (Apache-2.0). Ерийн Whisper монгол яриаг бараг танихгүй
(large-v3-turbo ч «ээээ…» давталтад ордог), энэ загвар жинхэнэ монгол үг гаргадаг.

Ажиллуулах:
    cd training/whisper && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
    .venv/bin/python convert_ct2.py        # → data/whisper-small-mn-8-ct2/ (Git-д орохгүй)
    .venv/bin/hf upload <hf-нэр>/whisper-small-mn-8-ct2 data/whisper-small-mn-8-ct2
"""

import logging
from pathlib import Path

from ctranslate2.converters import TransformersConverter
from transformers import WhisperTokenizerFast

SOURCE = "bayartsogt/whisper-small-mn-8"
OUT = Path(__file__).resolve().parent / "data" / "whisper-small-mn-8-ct2"
QUANTIZATION = "int8"  # сервер CPU дээр compute_type=int8 ажилладаг. ~241MB

logger = logging.getLogger("convert_ct2")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    TransformersConverter(SOURCE, copy_files=["preprocessor_config.json"]).convert(
        str(OUT), quantization=QUANTIZATION, force=True
    )
    # faster-whisper tokenizer.json уншдаг. Эх repo-д зөвхөн vocab.json, merges.txt байдаг.
    WhisperTokenizerFast.from_pretrained(SOURCE).backend_tokenizer.save(str(OUT / "tokenizer.json"))
    logger.info("→ %s: %s", OUT, sorted(path.name for path in OUT.iterdir()))


if __name__ == "__main__":
    main()
