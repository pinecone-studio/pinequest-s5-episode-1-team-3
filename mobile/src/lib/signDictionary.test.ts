import { expect, test } from "@jest/globals";

import { SIGN_VOCABULARY, signVideoUrl } from "./signDictionary";
import { PHRASE_SIGNS } from "./signPlan";

test("every curated phrase sign exists in the dictionary", () => {
  for (const word of Object.values(PHRASE_SIGNS).flat()) expect(SIGN_VOCABULARY.has(word)).toBe(true);
});

test("video URLs are percent-encoded so Cyrillic file names load", () => {
  expect(signVideoUrl("та", "https://sign.invalid/uploads/")).toBe("https://sign.invalid/uploads/2024/08/0116_%D0%A2%D0%90.mp4");
});

test("no URL without a configured base or for unknown words", () => {
  expect(signVideoUrl("та", "")).toBe("");
  expect(signVideoUrl("байхгүйүг", "https://sign.invalid")).toBe("");
});
