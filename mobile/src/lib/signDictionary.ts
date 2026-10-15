import dictionary from "./signDictionary.json";

// Үг → mnsl.mn дээрх видеоны зам. scripts/buildSignDictionary.ts үүсгэнэ (mnsl.mn-ийн зөвшөөрөлтэй).
export const SIGN_DICTIONARY: Readonly<Record<string, string>> = dictionary;
export const SIGN_VOCABULARY: ReadonlySet<string> = new Set(Object.keys(dictionary));

/** Видеоны бүтэн хаяг. Үг толь бичигт байхгүй эсвэл хаяг тохируулаагүй бол "". */
export function signVideoUrl(word: string, baseUrl: string): string {
  const path = SIGN_DICTIONARY[word];
  return path && baseUrl ? `${baseUrl.replace(/\/$/u, "")}/${encodeURI(path)}` : "";
}
