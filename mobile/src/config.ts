export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
  interpreterUrl: process.env.EXPO_PUBLIC_INTERPRETER_URL ?? "",
  // mnsl.mn-ийн дохионы видеоны үндсэн хаяг. Үг бүрийн зам lib/signDictionary.json-д.
  signVideoBaseUrl: process.env.EXPO_PUBLIC_SIGN_VIDEO_BASE_URL ?? "",
  requestTimeoutMs: 8_000,
  // Нэг бичлэгийн урт. Сервер 3 секунд тутам дүгнэнэ.
  recordChunkMs: 3_000,
} as const;
