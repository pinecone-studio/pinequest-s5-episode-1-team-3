import { describe, expect, test } from "@jest/globals";

import type { AlertKind } from "./alerts";
import { formatHistoryTime, type HistoryMode, historyMode, parseHistoryRow } from "./history";

const LABELS = { today: "Өнөөдөр", yesterday: "Өчигдөр" };
const NOW = new Date(2026, 9, 12, 0, 1);

describe("history", () => {
  const MODES: [AlertKind, HistoryMode][] = [
    ["knock", "home"],
    ["doorbell", "home"],
    ["alarm", "home"],
    ["queue", "queue"],
    ["name", "name"],
  ];

  test.each(MODES)("puts %s under the %s filter", (kind, mode) => {
    expect(historyMode(kind)).toBe(mode);
  });

  test("labels today and yesterday by calendar day, not by 24 hours", () => {
    expect(formatHistoryTime(new Date(2026, 9, 12, 0, 0).getTime(), NOW, LABELS)).toBe("Өнөөдөр 00:00");
    expect(formatHistoryTime(new Date(2026, 9, 11, 23, 59).getTime(), NOW, LABELS)).toBe("Өчигдөр 23:59");
  });

  test("shows the date for older entries, across a month boundary", () => {
    expect(formatHistoryTime(new Date(2026, 9, 10, 9, 5).getTime(), NOW, LABELS)).toBe("10-10 09:05");
    const firstOfMonth = new Date(2026, 10, 1, 8, 0);
    expect(formatHistoryTime(new Date(2026, 9, 31, 20, 0).getTime(), firstOfMonth, LABELS)).toBe("Өчигдөр 20:00");
  });

  test("parses a stored row", () => {
    const row = { id: 1, kind: "queue", ticket: "А-024", windowNumber: 3, createdAt: 10 };
    expect(parseHistoryRow(row)).toEqual({ id: 1, kind: "queue", ticket: "А-024", window: 3, createdAt: 10 });
  });

  test("keeps a row without ticket or window", () => {
    expect(parseHistoryRow({ id: 2, kind: "knock", ticket: null, windowNumber: null, createdAt: 10 })).toEqual({
      id: 2, kind: "knock", ticket: null, window: null, createdAt: 10,
    });
  });

  test.each([null, "row", { id: 1, kind: "fire", createdAt: 1 }, { id: "1", kind: "knock", createdAt: 1 }])(
    "skips a broken row %p",
    (row) => {
      expect(parseHistoryRow(row)).toBeNull();
    },
  );
});
