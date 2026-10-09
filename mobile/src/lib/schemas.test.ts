import { expect, test } from "@jest/globals";

import { parseDetectionResult } from "./schemas";

test("reads a knock result", () => {
  const result = parseDetectionResult({ sound: { label: "knock", score: 0.82 }, transcript: null, match: null, latencyMs: 410 });
  expect(result).toEqual({ sound: { label: "knock", score: 0.82 }, transcript: null, match: null, latencyMs: 410 });
});

test("reads a queue match without a window", () => {
  const result = parseDetectionResult({ sound: null, transcript: "А-024", match: { type: "queue", value: "А-024" }, latencyMs: 0 });
  expect(result?.match).toEqual({ type: "queue", value: "А-024", window: null });
});

test.each([
  ["not an object", "oops"],
  ["unknown label", { sound: { label: "music", score: 0.5 } }],
  ["score out of range", { sound: { label: "knock", score: 2 } }],
  ["bad match", { match: { type: "other", value: "x" } }],
])("rejects %s", (_name, body) => {
  expect(parseDetectionResult(body)).toBeNull();
});
