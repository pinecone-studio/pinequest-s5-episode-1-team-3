import { expect, test } from "@jest/globals";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { strings } from "@/strings";
import { BOARD_PHRASE_IDS, BOARD_PHRASES, phrasesFor, QUICK_REPLIES, SITUATIONS } from "./phraseBoard";
import { SIGN_VOCABULARY } from "./signDictionary";

const AUDIO_DIR = join(__dirname, "../../assets/audio");

test.each(BOARD_PHRASE_IDS)("%s has a sign video for every sign word", (id) => {
  expect(BOARD_PHRASES[id].signs.length).toBeGreaterThan(0);
  for (const word of BOARD_PHRASES[id].signs) expect(SIGN_VOCABULARY.has(word)).toBe(true);
});

// Дуу апп дотор байх ёстой: файлгүй бол Metro bundle хийхгүй, апп асахгүй.
test.each(BOARD_PHRASE_IDS)("%s has bundled speech and on-screen text", (id) => {
  expect(existsSync(join(AUDIO_DIR, `${id}.mp3`))).toBe(true);
  expect(strings.talk.board[id].trim()).not.toBe("");
});

test("every situation offers phrases and quick replies stay outside situations", () => {
  for (const situation of SITUATIONS) expect(phrasesFor(situation).length).toBeGreaterThan(0);
  expect(QUICK_REPLIES).toEqual(["yes", "no", "repeat", "slower", "wait"]);
  for (const situation of SITUATIONS) expect(phrasesFor(situation)).not.toContain("yes");
});

test("the first daily phrase tells the other person the user cannot hear", () => {
  expect(phrasesFor("daily")[0]).toBe("intro");
});
