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
.venv/bin/python train.py       # MLP сургаж, босгыг train CV-ээр сонгоно → data/sound_head.json, .joblib
.venv/bin/python evaluate.py    # baseline ба толгойг серверийн кодоор test дээр харьцуулна
```

## Серверт асаах

`train.py` нь `data/sound_head.json`-д жин, босгыг хамт хадгална. Сервер үүнийг numpy-гаар ажиллуулна (sklearn хэрэггүй):

```bash
# server/.env
SOUND_HEAD_MODEL=../training/sound/data/sound_head.json
```

Хоосон бол сервер одоогийн `LABEL_MAP` (baseline)-аар ажиллана. `/api/v1/health` → `models.sound` нь `yamnet+head` эсвэл `yamnet`.
