// talk.board-ийн өгүүлбэр бүрийн дууг assets/audio/<id>.mp3 болгож нэг удаа үүсгэнэ.
// Апп дотор хадгалснаар интернэт, сервергүй, шууд дуугарна. Серверийн хоолойтой ижил тохиргоо (server/app/models/tts.py).
// Ажиллуулах: bun --env-file=../server/.env scripts/buildPhraseAudio.ts
// Байгаа файлыг алгасна (төлбөр дахин гарахгүй). Бичвэр өөрчилсөн бол тэр файлыг устгаад дахин ажиллуулна.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

import { BOARD_PHRASE_IDS } from "../src/lib/phraseBoard";
import { strings } from "../src/strings";

const OUTPUT = new URL("../assets/audio/", import.meta.url);
const FORMAT = "mp3_44100_128";

const apiKey = process.env.ELEVENLABS_API_KEY ?? "";
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "";
const apiUrl = (process.env.ELEVENLABS_API_URL ?? "").replace(/\/$/u, "");
const model = process.env.ELEVENLABS_MODEL ?? "eleven_v4";
if (!apiKey || !voiceId || !apiUrl) throw new Error("ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ELEVENLABS_API_URL хэрэгтэй");

async function generate(text: string): Promise<ArrayBuffer> {
  const response = await fetch(`${apiUrl}/v1/text-to-dialogue?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: [{ text, voice_id: voiceId }], model_id: model, language_code: "mn" }),
  });
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  return response.arrayBuffer();
}

mkdirSync(OUTPUT, { recursive: true });
for (const id of BOARD_PHRASE_IDS) {
  const file = new URL(`${id}.mp3`, OUTPUT);
  if (existsSync(file)) continue;
  writeFileSync(file, Buffer.from(await generate(strings.talk.board[id])));
  process.stderr.write(`${id}.mp3\n`);
}
