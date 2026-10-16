import { expect, jest, test } from "@jest/globals";

import { addHistory, getHistory, historyTitle, subscribeHistory } from "./history";

const AT = new Date(2026, 9, 16, 9, 5);

test("newest alert comes first and the history screen is told", () => {
  const listener = jest.fn();
  const unsubscribe = subscribeHistory(listener);
  addHistory({ kind: "knock", at: AT, ticket: null, window: null });
  addHistory({ kind: "queue", at: AT, ticket: "24", window: 3 });
  unsubscribe();
  expect(getHistory().map((entry) => entry.kind).slice(0, 2)).toEqual(["queue", "knock"]);
  expect(listener).toHaveBeenCalledTimes(2);
});

test("keeps only the latest 50 alerts", () => {
  for (let i = 0; i < 60; i++) addHistory({ kind: "name", at: AT, ticket: null, window: null });
  expect(getHistory()).toHaveLength(50);
});

test.each([
  ["24", 3, "24 дугаар · 3-р цонх"],
  ["24", null, "24 дугаар"],
])("queue %s window %s reads «%s»", (ticket, window, title) => {
  expect(historyTitle({ id: 1, kind: "queue", at: AT, ticket, window })).toBe(title);
});

test("other alerts use the alert title", () => {
  expect(historyTitle({ id: 1, kind: "doorbell", at: AT, ticket: null, window: null })).toBe("Хонх дуугарлаа");
});
