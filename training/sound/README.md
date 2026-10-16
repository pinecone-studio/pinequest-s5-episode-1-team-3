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
├─ raw/fsd50k/      FSD50K ground_truth + metadata (zenodo.org/records/4060432),
│                   eval_audio + dev_audio-ийн хэсэг (download_fsd50k.py)
└─ raw/home/        Багийн гэрийн бичлэг (зөвшөөрөлтэй, speaker_01 …)
```

## Алхамууд

```bash
.venv/bin/python download_fsd50k.py   # eval бүтнээр + dev-ээс хонх, тогшилт, андуурагдах дуу (~7GB, HF толь)
.venv/bin/python prepare.py    # 5 ангилал руу хөрвүүлж, 16kHz mono болгоно → data/manifest.csv
sh ../../server/scripts/download_models.sh   # сервертэй ижил yamnet.tflite
.venv/bin/python features.py   # YAMNet 521 онооны дундаж + max → data/features.npz
.venv/bin/python train.py       # MLP сургаж, босгыг train CV-ээр сонгоно → data/sound_head.json, .joblib
.venv/bin/python evaluate.py    # baseline ба толгойг серверийн кодоор test дээр харьцуулна
```

## HF-ээс давтан сургах (түүхий бичлэггүй)

Түүхий бичлэг (~7 GB) хэрэггүй. YAMNet-ийн бэлэн шинж багийн private dataset-д бий
(`sonsyo/sonsyo-sound-data`, 12 MB). `sonsyo` байгууллагын гишүүн, `hf auth login` хийсэн байх ёстой.

```bash
sh ../../server/scripts/download_models.sh   # сервертэй ижил yamnet.tflite
.venv/bin/hf download sonsyo/sonsyo-sound-data features.npz --repo-type dataset --local-dir data
.venv/bin/python train.py      # → data/sound_head.json
.venv/bin/python evaluate.py   # data/16k байхгүй тул худал мэдэгдэл/цагийг хэсгийн тоо × 3 сек-ээр тооцно
```

Windows дээр `.venv/bin/` → `.venv\Scripts\`. Seed тогтмол тул нэг компьютер дээр ижил загвар гарна.
Mac, Windows хоёр дээр тоо бага зэрэг зөрнө: [RESULTS.md](../RESULTS.md) → «v2 дахин».
8 GB RAM-тай Windows лаптоп дээр `train.py` ~4 цаг (6 сургалт × 23–58 мин) болсон. Хүнд програмуудаа хаа.

## Серверт асаах

`train.py` нь `data/sound_head.json`-д жин, босгыг хамт хадгална. Сервер үүнийг numpy-гаар ажиллуулна (sklearn хэрэггүй):

```bash
# server/.env
SOUND_HEAD_MODEL=../training/sound/data/sound_head.json
```

Хоосон бол сервер одоогийн `LABEL_MAP` (baseline)-аар ажиллана. `/api/v1/health` → `models.sound` нь `yamnet+head` эсвэл `yamnet`.

## HF Hub руу оруулах (Git-д биш)

Багийн нэрээр (`sonsyo`) нийтэлнэ. Шинэ хувилбар бүр HF дээр тусдаа commit болж хадгалагдана:

```bash
.venv/bin/hf auth login     # нэг удаа, өөрийн «Write» токеноор
.venv/bin/hf upload sonsyo/sonsyo-sound-head data/sound_head.json sound_head.json
```

Тоог [training/RESULTS.md](../RESULTS.md)-д нэмнэ.
