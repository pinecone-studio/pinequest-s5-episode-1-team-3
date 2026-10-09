import { expect, test } from "@jest/globals";
import { talkTranscriptSchema } from "./talkTranscript";

test("validates a transcript without guessing missing text", () => {
  expect(talkTranscriptSchema.parse({ text: "Сайн байна уу?" })).toEqual({ text: "Сайн байна уу?" });
});

test.each([{}, null, { text: 123 }, { text: "x".repeat(2_001) }])("rejects an invalid server response %j", (response) => {
  expect(talkTranscriptSchema.safeParse(response).success).toBe(false);
});
