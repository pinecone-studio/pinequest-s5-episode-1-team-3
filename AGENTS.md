# AGENTS.md — Сонсъё (SIGNO)

> Энэ файлыг багийн **хүн бүр** болон **AI агент** (Claude Code, Cursor, Codex, Copilot) код бичихээс өмнө уншина.
> Дүрмийг өөрчлөх бол багаараа ярилцаад энэ файлыг PR-аар засна. `CLAUDE.md` нь энэ файлыг л заадаг.
> `mobile/` дээр ажиллахдаа **[mobile/AGENTS.md](mobile/AGENTS.md)**-г (Expo-гийн албан ёсны заавар, SDK 57) мөн унш.

---

## Хамгийн чухал 8 дүрэм

1. Файлыг доорх **«Хавтасны бүтэц»**-ийн дагуу л үүсгэ. Шинэ дээд түвшний хавтас үүсгэхгүй.
2. **«Хэн юу хийх вэ»** хүснэгтэд өөр хүнд оногдсон файлыг засах бол тэр хүнээс асуу.
3. **«API гэрээ»**-г хүнээс асуулгүйгээр өөрчлөхгүй.
4. Багц менежер нь зөвхөн **bun**. `npm`, `yarn`, `package-lock.json` хэрэглэхгүй.
5. **Шинэ сан** нэмэхээс өмнө хүнээс асуу. Expo сан бол `bunx expo install <сан>`.
6. `any`, `console.log`, `print`, магик тоо, кодонд шууд бичсэн URL/IP/түлхүүр **хориотой**.
7. **Асуудал, зөрчил олвол тойрч бүү шийд. Шууд хүнд хэл.** (Жишээ: гэрээ таарахгүй, сан Expo Go-д ажиллахгүй, тест унав.)
8. Дуусгаад **«Шалгалт»** хэсгийн командуудыг ажиллуулж үр дүнг хэл. Commit, push-ийг **хүн өөрөө** хийнэ.

---

## Төсөл юу хийдэг вэ

Сонсголын бэрхшээлтэй хүнд чухал дууг **чичиргээ, дэлгэцийн өнгө, том бичвэр**-ээр мэдэгддэг Android апп.

| Горим | Юуг мэдэгдэх | AI |
|---|---|---|
| `home` | Хаалга тогших, хонх/домофон, сэрүүлэг | YAMNet + **бидний сургасан толгой** |
| `queue` | «А тэг хорин дөрөв, гуравдугаар цонх» | **Бидний fine-tune хийсэн** Whisper → монгол тоо парсер → тулгах |
| `name` | Хэрэглэгчийн нэрийг дуудах | Whisper → нэр тулгах |
| `talk` | Ажилтны яриаг бичвэрээр | Whisper |

```
📱 Апп ── 3 сек аудио ──▶ 🖥️ Сервер ── home ──▶ YAMNet + толгой ──────────────┐
                                     └ queue/name/talk ▶ Whisper ▶ парсер, тулгах ┤
📱 Чичиргээ, өнгө, бичвэр ◀──────────── DetectionResult ◀─────────────────────────┘
```

**Нэр томьёо**

| Нэр | Юу вэ |
|---|---|
| YAMNet | Google-ийн бэлэн дууны загвар. 521 ангилалтай |
| MediaPipe | YAMNet-ийн `.tflite` файлыг ажиллуулдаг сан (`mediapipe` Python package). Загвар биш |
| Толгой (head) | YAMNet-ийн гаргасан тоонууд дээр **бидний сургадаг** жижиг ангилагч |
| Fine-tune | Бэлэн загварын **өөрийнх нь жинг** бидний өгөгдлөөр үргэлжлүүлэн сургах |
| Домофон | Дуугарахыг `doorbell` гэж ангилна. Домофоны яриаг таних нь энэ төслийн хүрээнд **ороогүй** |

---

## Хоёр төрлийн сургалт (ялгааг нь заавал ойлго)

```
Whisper — FINE-TUNE (загварыг өөрийг нь сургана)
  Бэлэн Whisper (bayartsogt/whisper-small-mn-8)
    → монгол зарлалын бичлэг
    → fine-tune (Colab)
    → CTranslate2 болгох → HF Hub private repo
    → сервер: WHISPER_MODEL env солих

YAMNet — HEAD TRAINING (YAMNet-д хүрэхгүй, дээр нь жижиг загвар сургана)
  Бэлэн YAMNet (хөдлөхгүй)
    → дуу бүрийн тоон дүрслэл
    → бидний жижиг толгой (sklearn / жижиг neural net)
    → knock / doorbell / alarm / speech / other
    → сервер: SOUND_HEAD_MODEL env солих
```

**YAMNet-ийг бүхэлд нь fine-tune хийхгүй.**

**Баталгаажуулах шаардлагатай:** MediaPipe-ийн `AudioClassifier` нь 521 ангиллын **оноо** буцаадаг, 1024 хэмжээст embedding буцаадаггүй байж магадгүй. Толгойг юун дээр сургахыг дуу хариуцсан хүн (6) эхний өдөр туршиж шийдээд энд бичнэ:
- (a) 521 онооны дундаж дээр сургах. Сервер дээр зөвхөн `mediapipe` хэрэгтэй, хөнгөн.
- (b) 1024 embedding дээр сургах. Илүү нарийвчлалтай ч сервер дээр `tensorflow` хэрэгтэй, хүнд.

**Дараалал:**
1. Бэлэн загвараар апп ажиллуулна.
2. Baseline (нарийвчлал, хурд) хэмжинэ.
3. Өгөгдөл цуглуулна.
4. Сургана.
5. Baseline-аас **сайжирсан бол л** сервер дээр сольно. Үгүй бол хуучныг үлдээнэ.

---

## Хавтасны бүтэц

```
/
├─ mobile/                      Expo (SDK 57) · TypeScript · Expo Router · bun
│  ├─ src/
│  │  ├─ app/                   Дэлгэц. Файл = дэлгэц. Зөвхөн UI угсарна
│  │  ├─ components/            Дахин ашиглах UI, theme.ts
│  │  ├─ hooks/                 React state (useListener, useAlert …)
│  │  ├─ lib/                   ЦЭВЭР логик + тест. React, fetch, expo-* import ХИЙХГҮЙ
│  │  │  ├─ types.ts            API гэрээ (TypeScript төрөл)
│  │  │  └─ schemas.ts          API гэрээ (zod)
│  │  ├─ services/              Гадаад ертөнцтэй харьцах хэсэг
│  │  │  ├─ detector/           Сервер рүү аудио илгээх
│  │  │  ├─ audio/              Микрофон (expo-audio)
│  │  │  └─ storage/            Түүх, тохиргоо (expo-sqlite)
│  │  ├─ config.ts              Орчны хувьсагч унших ЦОРЫН ГАНЦ газар
│  │  └─ strings.ts             Дэлгэцийн бүх монгол бичвэр
│  └─ app.json  eas.json  .env.example  bun.lock
├─ server/                      Python 3.12 · FastAPI · Docker
│  ├─ app/
│  │  ├─ main.py                Endpoint (нимгэн)
│  │  ├─ config.py              Орчны хувьсагч унших ЦОРЫН ГАНЦ газар
│  │  ├─ schemas.py             API гэрээ (pydantic)
│  │  ├─ pipeline.py            Горим → аль загвар
│  │  ├─ audio.py               m4a → 16kHz mono
│  │  ├─ models/                sound.py (YAMNet + толгой), speech.py (Whisper)
│  │  └─ text/                  numbers.py (монгол тоо), matching.py (дугаар, нэр тулгах)
│  ├─ tests/
│  ├─ Dockerfile  requirements.txt  requirements-dev.txt
│  └─ README.md                 HF Space-ийн тохиргоо. Дээд хэсгийг устгахгүй
├─ training/                    Colab notebook, скрипт. Дуу бичлэг ОРОХГҮЙ
│  ├─ whisper/                  baseline · fine-tune · CTranslate2 болгох
│  ├─ sound/                    толгой сургах
│  ├─ eval/                     Үнэлгээний скрипт (нарийвчлал, хурд) → RESULTS.md
│  └─ RESULTS.md                Загварын хувилбар бүрийн тоо
├─ .github/workflows/           ci.yml · deploy-server.yml · build-apk.yml
├─ AGENTS.md                    Энэ файл
├─ CLAUDE.md                    «@AGENTS.md» гэсэн нэг мөр
└─ README.md                    Хүнд зориулсан танилцуулга
```

| Хэрэв … | Хаана |
|---|---|
| Шинэ дэлгэц | `mobile/src/app/` |
| Тооцоо, шийдвэр (тестлэх ёстой) | `mobile/src/lib/` эсвэл `server/app/text/` |
| Сүлжээ, микрофон, хадгалах | `mobile/src/services/` |
| Дэлгэцийн бичвэр | `mobile/src/strings.ts` (өөрийн дэлгэцийн хэсэгт) |
| Сургалт, үнэлгээ | `training/` |

---

## Хэн юу хийх вэ (7 хүн, бүгд код бичиж PR явуулна)

| # | Хүн | Хийх ажил | Файлууд | Figma дэлгэц |
|---|---|---|---|---|
| 1 | Frontend | Дизайн систем, горим сонгох, мэдэгдлийн дэлгэц, тохиргоо, тусламж | `components/`, `app/_layout.tsx`, `app/index.tsx`, `app/settings.tsx`, `app/help.tsx`, `lib/alerts.ts` | 01, 04, 05, 08, 10, 13, 14, 15 |
| 2 | Frontend | Гэрийн горим, тасралтгүй сонсох, түүх | `app/home.tsx`, `app/history.tsx`, `hooks/useListener.ts`, `services/audio/`, `services/storage/`, `lib/cooldown.ts` | 02, 03, 12 |
| 3 | Frontend | Дарааллын горим, нэр дуудах, ярилцах | `app/queue.tsx`, `app/name.tsx`, `app/talk.tsx`, `lib/ticket.ts` | 06, 07, 16, 09, 11 |
| 4 | Backend, DevOps | Сервер, API гэрээ, аппаас сервер рүү хүсэлт илгээх, Docker, CI, HF Space, APK | `server/app/main.py`, `config.py`, `schemas.py`, `pipeline.py`, `audio.py`, `mobile/src/services/detector/`, `lib/types.ts`, `lib/schemas.ts`, `.github/` | — |
| 5 | AI (яриа) | Whisper baseline, fine-tune, монгол тоо парсер | `training/whisper/`, `server/app/models/speech.py`, `server/app/text/numbers.py` | — |
| 6 | AI (дуу) | YAMNet ажиллуулах, толгой сургах | `training/sound/`, `server/app/models/sound.py` | — |
| 7 | Өгөгдөл, үнэлгээ | Үнэлгээний скрипт, өгөгдөл бэлтгэх скрипт, дугаар/нэр тулгах логик, бичлэг цуглуулах зохион байгуулалт | `training/eval/`, `training/RESULTS.md`, `server/app/text/matching.py` | — |

**Олон хүн засдаг файлууд**

| Файл | Дүрэм |
|---|---|
| `strings.ts` | Зөвхөн өөрийн дэлгэцийн хэсэгт (`home`, `queue` …) нэмнэ |
| `app/_layout.tsx` | Өөрийн `<Stack.Screen>` мөрийг л нэмнэ |
| `package.json`, `bun.lock`, `app.json` | Тусдаа жижиг PR (`chore(mobile): add expo-sqlite`) |
| `lib/types.ts`, `lib/schemas.ts`, `server/app/schemas.py` | 4-р хүнтэй хамт, нэг PR-т |

**Мэдэгдэл бүрт шинэ компонент хийхгүй.** Нэг `AlertOverlay` байна. Шинэ төрлийн мэдэгдэл = `lib/alerts.ts`-д нэг мөр нэмэх.

---

## API гэрээ

Апп ба сервер **зөвхөн үүгээр** харьцана. Өөрчлөх бол апп, сервер хоёуланг **нэг PR-т** засна.

```
GET  /api/v1/health → { status: "ok", version, models: { sound: "<хувилбар>" | null, whisper: "<хувилбар>" | null } }

POST /api/v1/detect   multipart/form-data
     audio   m4a, AAC, mono, 16kHz, ≤ 10 сек, ≤ 1MB
     mode    "home" | "queue" | "name" | "talk"
     ticket  "А-024"   (queue)
     name    "Болд"    (name)

→ 200 { sound:      { label: "knock" | "doorbell" | "alarm" | "speech" | "other", score: 0–1 } | null,
        transcript: string | null,
        match:      { type: "queue" | "name", value: string, window: number | null } | null,
        latencyMs:  number }
→ 4xx/5xx { error: { code: "AUDIO_TOO_LONG" | "BAD_AUDIO" | "MODELS_NOT_LOADED" | …, message } }
```

- Апп хариуг **zod**-оор шалгана. Тэнцэхгүй бол алдааны дэлгэц (Figma 15) гарна, апп унахгүй.
- Хүсэлтийн timeout: **8 сек**.
- Сервер аудиог **хадгалахгүй**, логт бичихгүй.
- YAMNet-ийн 521 ангиллыг дээрх 5 ангилал руу `server/app/models/sound.py` дотор **нэг газар** хөрвүүлнэ.

---

## Код бичих дүрэм

**TypeScript (`mobile/`)**
- `strict: true`. `any` хориотой. Мэдэхгүй төрөл бол `unknown` + zod ашигла.
- Файл ≤ 200 мөр, функц ≤ 40 мөр.
- Нэрлэх: компонент `PascalCase.tsx`, hook `useXxx`, бусад `camelCase`, тогтмол `UPPER_SNAKE_CASE`.
- Early return ашигла. `if`-ийг 3-аас олон түвшнээр давхарлахгүй.
- Тайлбарт «юу»-г биш, **«яагаад»**-ыг бич.
- Зөвхөн **Expo Go-д ажилладаг** сан ашиглана (`bunx expo install`). Native (Kotlin) код бичихгүй.
- Хүртээмж:
  - Товч ≥ 56px, бичвэр ≥ 18pt, өнгөний ялгаа өндөр.
  - Мэдэгдэл бүрт **дүрс, бичвэр, чичиргээ** гурвуулаа байна.

**Python (`server/`, `training/`)**
- Бүх функцэд type hint бич. `ruff format` + `ruff check` ажиллуул.
- Оролт, гаралт бүр pydantic загвартай (`schemas.py`).
- Endpoint нимгэн байна. Ажлыг `pipeline.py`, `models/`, `text/` руу шилжүүл.
- `print` хориотой, `logging` ашигла.
- Загваруудыг сервер асахад **нэг удаа** ачаална.
- `text/` нь цэвэр функц (файл, сүлжээ, загвар ашиглахгүй) бөгөөд **заавал тесттэй**.
- `requirements.txt` дээр бүх сан `==` хувилбартай.

---

## Deploy ба APK: эвдрэхээс сэргийлэх дүрэм

1. **Эхний өдрөөс deploy хий.** `main` руу merge хийх бүрт сервер HF Space-д автоматаар гарна. APK-г эрт, байнга build хийж туршина.
2. **Орчны ялгаа зөвхөн env-д.** Апп `EXPO_PUBLIC_API_URL`, сервер `config.py` ашиглана. Кодонд хаяг бичихгүй.
3. **APK зөвхөн https-тэй ажиллана.** `eas.json`-ийн `preview` профайл HF Space-ийн `https://…hf.space` хаягтай байна.
4. **Сервер Docker-тэй.** Загварыг runtime-д биш, **build хийх үед** татна. Port 7860, root биш хэрэглэгч.
5. **Загвар солих = env солих.** Шинэ загвар HF Hub-д гарахад `WHISPER_MODEL` / `SOUND_HEAD_MODEL`-ийг сольж дахин deploy хийнэ. Код өөрчлөхгүй.
6. **Хурдны хязгаар (HF CPU дээр хэмжинэ):** `home` ≤ 1 сек, `queue` ≤ 3 сек. Хэтэрвэл Whisper-ийн хэмжээг багасга.
7. **Демогийн нөөц:** A — HF Space · B — лаптоп сервер + утасны hotspot · C — бичсэн видео.

---

## Өгөгдөл

- Бичлэг Git-д **орохгүй**. HF private dataset эсвэл багийн Drive-д хадгална.
- Бичихийн өмнө **зөвшөөрөл** авна. Нэрийг `speaker_01` гэх мэтээр солино.
- Өгөгдлийг train/test-д **хүнээр нь** хуваана: нэг хүний бичлэг хоёуланд нь орохгүй.
- Загварын хувилбар бүрийн тоог `training/RESULTS.md`-д бичнэ: огноо, өгөгдөл, нарийвчлал, хурд.

---

## Шалгалт

```bash
cd mobile && bun run lint && bun run typecheck && bun run test
cd server && ruff check . && ruff format --check . && pytest
```

**Заавал тесттэй:**
- `text/numbers.py`: «тэг хорин дөрөв» → 24, «нэг зуун арван тав» → 115
- `text/matching.py`: А-024 таарна, Б-024 таарахгүй; «Болдоо» ≈ «Болд»
- `lib/cooldown.ts`
- `lib/alerts.ts`
- `lib/schemas.ts`

Алдаа засах бүрт тэр алдааг дахин гаргахгүй тест нэм.

---

## Git

- `main`-д **шууд push хийхгүй**, зөвхөн PR-аар. PR бүрийг 1 хүн review хийнэ. CI ногоон байна.
- Branch: `feat/queue-screen`, `fix/cooldown`, `chore/ci`, `train/whisper-v2`.
- Commit: Conventional Commits (`feat(mobile): …`, `fix(server): …`). «done», «fix», «asdf» хориотой.
- PR ≤ 300 мөр. Тайлбарт юу, яагаад, яаж туршсанаа бич. UI бол зураг хавсаргана.
- Git-д хэзээ ч оруулахгүй: `.env`, `node_modules/`, `.venv/`, загварын жин (`*.pt`, `*.bin`, `*.tflite`), дуу бичлэг.

**Дууссан гэх шалгуур**
- [ ] «Шалгалт» ногоон
- [ ] Жинхэнэ Android утсан дээр туршсан (UI бол)
- [ ] Гэрээ өөрчлөгдсөн бол апп + сервер хоёулаа шинэчлэгдсэн
- [ ] Нууц, бичлэг, жин ороогүй
- [ ] 1 хүн review хийсэн
