import { describe, expect, test } from "@jest/globals";

import { normalizeTicket } from "./ticket";

describe("normalizeTicket", () => {
  test.each([
    ["а 24", "А-024"], ["24", "024"], ["А024", "А-024"],
    ["A024", "А-024"], ["  Б-024  ", "Б-024"], ["024", "024"],
    ["ү 7", "Ү-007"], ["999", "999"], ["0", "000"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeTicket(input)).toBe(expected);
  });

  test.each(["", "   ", "А", "АБ24", "1234", "-24", "24.5", "А-24!", "А--24"])(
    "rejects invalid ticket %s", (input) => {
      expect(normalizeTicket(input)).toBeNull();
    },
  );
});
