# Сонсъё (SIGNO) 👂📳

Сонсголын бэрхшээлтэй хүнд чухал дууг **чичиргээ, дэлгэцийн өнгө, том бичвэрээр** мэдэгддэг Android апп.
PineQuest S5 · Team 3 · Сэдэв: *AI Models for Real-World Problem*

> Код бичихээс өмнө **[AGENTS.md](AGENTS.md)**-г унш (кодын дүрэм, хэн юу хийх вэ, API гэрээ).

---

## Бүтэц

```
mobile/     Expo (React Native, TypeScript) апп       → bun     Metro :8081
server/     FastAPI AI сервер (YAMNet + Whisper)       → Python  http://localhost:8000
training/   Загвар сургах, үнэлэх (Colab)              → Python  —
```

## Порт ба орчны хувьсагч

| Хэсэг | Хавтас | Хаяг | Env файл | Гол хувьсагч |
|---|---|---|---|---|
| AI сервер | `server/` | http://localhost:8000 (лаптоп) · `https://<hf-нэр>-signo-api.hf.space` (онлайн) | `server/.env` | `WHISPER_MODEL`, `SOUND_HEAD_MODEL` |
| Апп | `mobile/` | Metro :8081 | `mobile/.env` | `EXPO_PUBLIC_API_URL` |

> `.env` файлыг хэзээ ч commit хийхгүй. Шинэ хувьсагч нэмбэл `.env.example`-д нэрийг нь бичнэ.

## Шаардлагатай програм

- **Git**, **VS Code**
- **bun** — https://bun.sh (`npm`, `yarn` ашиглахгүй)
- **Python 3.12**
- **Android утас** + Play Store-оос **Expo Go**
- (Сонголтоор) **Docker Desktop** — серверийг онлайнтай яг ижил орчинд ажиллуулах

## Анх удаа суулгах

```bash
git clone https://github.com/pinecone-studio/pinequest-s5-episode-1-team-3.git
cd pinequest-s5-episode-1-team-3

# Апп
cd mobile && bun install && cp .env.example .env && cd ..

# Сервер
cd server
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cd ..
```

## 1 · Сервер → http://localhost:8000

```bash
cd server && source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Шалгах: `curl localhost:8000/api/v1/health` → `{"status":"ok"}`

> `--host 0.0.0.0` заавал. Эс бөгөөд утас холбогдохгүй.

## 2 · Апп (Expo Go)

```bash
# mobile/.env → EXPO_PUBLIC_API_URL=http://<лаптопын IP>:8000
#   Mac: ipconfig getifaddr en0 · Windows: ipconfig → IPv4 Address
cd mobile && bunx expo start
```

Утсан дээрх **Expo Go**-оор терминалын QR кодыг уншуулна. Утас, лаптоп **нэг Wi-Fi**-д байна.

- Холбогдохгүй бол: `bunx expo start --tunnel`
- `.env` өөрчилсний дараа: `bunx expo start -c`

## Ажиллуулах дараалал

1. **Сервер** (лаптоп эсвэл онлайн) → `/api/v1/health` ажиллаж байгааг шалга
2. **Апп** → `mobile/.env`-д серверийн хаяг → `bunx expo start`

## Шалгалт (PR бүрийн өмнө)

```bash
cd mobile && bun run lint && bun run typecheck && bun run test
cd server && ruff check . && ruff format --check . && pytest
```

---

## Deploy

| Юу | Хаана | Хэрхэн |
|---|---|---|
| Сервер | Hugging Face Spaces (үнэгүй, https) | `main` руу `server/` өөрчлөлт merge хийгдэхэд **автоматаар** (`.github/workflows/deploy-server.yml`) |
| Апп (APK) | EAS Build | GitHub → Actions → **Build Android APK**, эсвэл `cd mobile && bun run build:apk` |

**Анх удаа тохируулах (нэг удаа):**
1. Hugging Face → **New Space** → нэр `signo-api` → SDK **Docker** → **CPU basic (free)**.
2. Hugging Face → Settings → Access Tokens → **Write** эрхтэй токен үүсгэнэ.
3. GitHub repo → Settings → Secrets and variables → Actions:
   - Secret `HF_TOKEN`
   - Variable `HF_SPACE_ID` = `<hf-нэр>/signo-api`
   - Secret `EXPO_TOKEN` (expo.dev → Access tokens)
4. `cd mobile && bunx eas-cli@latest login && bunx eas-cli@latest init` → `app.json`-ийн өөрчлөлтийг PR-аар оруулна.
5. `mobile/eas.json` → `preview.env.EXPO_PUBLIC_API_URL`-д Space-ийн **https** хаягийг бичнэ.

**Гараар deploy хийх (admin эрхгүй, эсвэл CI ажиллахгүй үед):**

```bash
pip install huggingface_hub
hf auth login
hf upload <hf-нэр>/signo-api server . --repo-type=space --exclude ".venv/*" "tests/*" "**/__pycache__/*" ".env"
```

> ⚠️ **Онлайн сервер хуучирч болно.** Сервер дээр өөрчлөлт хийгээд deploy хийгээгүй бол APK хуучин серверт хандаж, «репо дээрх код зөв атлаа апп ажиллахгүй» алдаа гарна. Сервер өөрчилсний дараа HF Space-ийн **Logs**-оос шинэ build гарч **Running** болсныг шалга.

> **APK зөвхөн https-тэй ажиллана.** Expo Go дээр ажилласан `http://192.168…` хаяг APK-д ажиллахгүй.

---

## Түгээмэл асуудал

| Асуудал | Шийдэл |
|---|---|
| Expo Go: «Could not connect» | Утас, лаптоп нэг Wi-Fi-д байгаа эсэх · `bunx expo start --tunnel` |
| Апп «Сервертэй холбогдож чадсангүй» | `mobile/.env`-ийн хаяг зөв эсэх · сервер `--host 0.0.0.0`-оор ассан эсэх · `bunx expo start -c` |
| Expo Go дээр ажилладаг, APK дээр ажиллахгүй | APK-д `http://` хаяг орсон. `eas.json`-д https Space хаяг бич |
| Код зөв атлаа онлайн сервер хуучин хариу өгнө | Deploy хийгдээгүй. Дээрх «Гараар deploy хийх» |
| EAS build «projectId» алдаа | `bunx eas-cli@latest init` хийгээгүй |
