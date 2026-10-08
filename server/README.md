---
title: SIGNO API
emoji: 👂
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# SIGNO API

> Дээд хэсэг (`---` хооронд) нь Hugging Face Spaces-ийн тохиргоо. Устгахгүй.

## Харилцах demo

`GET /api/v1/talk/speech?phrase=greeting` эсвэл `phrase=thanks` нь `audio/mpeg` буцаана.
Бусад өгүүлбэрийг зөвшөөрөхгүй. Хуучин health/detect гэрээг өөрчлөөгүй.

`server/.env.example`-ийг үндэслэж `server/.env` үүсгээд
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` тохируулна. Түлхүүр mobile env-д орохгүй.
`ELEVENLABS_MODEL=eleven_v4`: албан ёсны жагсаалтаар монгол хэл дэмждэг.
Eleven v3, Multilingual v2 нь монголыг албан ёсоор дэмждэггүй.

```bash
cd server
set -a
source .env
set +a
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Mobile-ийн `EXPO_PUBLIC_API_URL`-д энэ серверийн хаягийг тавьж Expo-г дахин асаана.
Утаснаас Mac-ийн localhost биш, ижил Wi-Fi дахь IP ашиглана. APK-д HTTPS хэрэгтэй.
Web дээр ажиллуулахдаа Expo-ийн origin-ийг `CORS_ORIGINS`-д тохируулна.

ElevenLabs руу зөвхөн хоёр бэлэн өгүүлбэрийн бичвэр илгээнэ; хэрэглэгчийн микрофон ашиглахгүй.
Энэ урсгал дохионы хөдөлгөөнийг AI-аар танихгүй: хэрэглэгч бэлэн дохиотой карт сонгодог.
Үүсгэсэн аудиог файлд хадгалахгүй, процессын RAM-д хамгийн ихдээ хоёр клип түр ашиглана.
Хоёр клипийн анхны үүсгэлт provider-ийн quota/төлбөр ашиглана. Сервер дахин асвал RAM cache арилна.
Түлхүүр дутвал `503 TTS_NOT_CONFIGURED`, provider алдаанд `502` буцаана.
Бичвэр нь аудио амжилтгүй байсан ч дэлгэцэд үлдэнэ.

Дохионы эх сурвалж: [mnsl.mn — Сайн байна уу?](https://mnsl.mn/ug/28-сайн-байна-уу/),
[Баярлалаа](https://mnsl.mn/ug/137-баярлалаа/). SVG дараалал нь бичлэгээс хялбаршуулсан ноорог;
дохионы хөдөлгөөнийг бүтнээр нь эх бичлэгээр үзүүлнэ. SVG-ийн гарын хэлбэр, алганы чиглэл,
хөдөлгөөн, нүүрний хувирлыг дохионы хэл мэддэг хүнээр баталгаажуулах шаардлагатай.
Нийтийн release-ийн өмнө asset ашиглах эрхийг мөн баталгаажуулна.
