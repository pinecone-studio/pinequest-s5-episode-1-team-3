# Дууны толгой (YAMNet + MLP)

YAMNet-ийн 521 онооны дундаж + max (1042 тоо) дээр жижиг MLP сургаж
`knock / doorbell / alarm / speech / other` гэж ангилна. Шийдвэрийн учир: [AGENTS.md](../../AGENTS.md) → «Хоёр төрлийн сургалт».

## Бэлтгэл

```bash
cd training/sound
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Өгөгдөл (Git-д орохгүй)

Бүх бичлэг, шинж, загвар `training/sound/data/` дотор байна (`.gitignore` → `data/`).

```
data/
├─ raw/esc50/       ESC-50 zip-ийг задалсан (github.com/karolpiczak/ESC-50)
├─ raw/fsd50k/      FSD50K eval_audio + ground_truth + metadata (zenodo.org/records/4060432)
└─ raw/home/        Багийн гэрийн бичлэг (зөвшөөрөлтэй, speaker_01 …)
```

## Алхамууд

```bash
.venv/bin/python prepare.py    # 5 ангилал руу хөрвүүлж, 16kHz mono болгоно → data/manifest.csv
sh ../../server/scripts/download_models.sh   # сервертэй ижил yamnet.tflite
.venv/bin/python features.py   # YAMNet 521 онооны дундаж + max → data/features.npz
```

