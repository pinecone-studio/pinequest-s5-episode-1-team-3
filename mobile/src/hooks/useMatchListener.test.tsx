import { useEffect } from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useRouter } from "expo-router";
import { useListener } from "./useListener";
import { useMatchListener } from "./useMatchListener";
import type { DetectionResult } from "@/lib/types";

jest.mock("./useListener", () => ({ useListener: jest.fn() }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: (effect: () => (() => void)) => {
    jest.requireActual<typeof import("react")>("react").useEffect(effect, [effect]);
  },
}));
const push = jest.fn();
const stop = jest.fn();
const start = jest.fn<() => Promise<void>>().mockResolvedValue();
const listener = { listening: false, error: null, start, stop } as ReturnType<typeof useListener>;
let current: ReturnType<typeof useMatchListener>;
let tree: ReactTestRenderer;
let mode: "queue" | "name";
function Harness() { const value = useMatchListener(mode, mode === "queue" ? "А-024" : "Болд"); useEffect(() => { current = value; }); return null; }
beforeEach(() => {
  jest.clearAllMocks(); mode = "queue"; listener.error = null;
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useListener).mockReturnValue(listener);
});
afterEach(async () => { await act(async () => tree?.unmount()); });
async function mount() {
  await act(async () => { tree = create(<Harness />); });
  await act(async () => current.start());
}
function result(match: DetectionResult["match"]) {
  act(() => jest.mocked(useListener).mock.calls.at(-1)![0].onResult({ sound: null, transcript: null, latencyMs: 1, match }));
}

test.each(["queue", "name"] as const)("%s sends the target and opens one alert only on match", async (selectedMode) => {
  mode = selectedMode; await mount();
  expect(useListener).toHaveBeenLastCalledWith(expect.objectContaining(mode === "queue" ? { mode, ticket: "А-024" } : { mode, name: "Болд" }));
  result(null); expect(push).not.toHaveBeenCalled();
  const match = { type: mode, value: mode === "queue" ? "А-024" : "Болд", window: mode === "queue" ? 3 : null };
  result(match); result(match);
  expect(push).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledWith({ pathname: "/alert", params: mode === "queue" ? { kind: mode, ticket: "А-024", window: "3" } : { kind: mode } });
  expect(stop).toHaveBeenCalled();
  expect(stop.mock.invocationCallOrder[0]).toBeLessThan(push.mock.invocationCallOrder[0]);
});
test("wrong mode and results after stopping do not navigate", async () => {
  await mount(); result({ type: "name", value: "Болд", window: null });
  act(() => current.stop()); result({ type: "queue", value: "А-024", window: null });
  expect(push).not.toHaveBeenCalled();
});
test("leaving the screen stops and ignores late results", async () => {
  await mount(); await act(async () => tree.unmount());
  result({ type: "queue", value: "А-024", window: null });
  expect(stop).toHaveBeenCalled(); expect(push).not.toHaveBeenCalled();
});
test.each(["server", "noServer"] as const)("%s error stops and opens the error screen", async (error) => {
  await mount(); listener.error = error;
  await act(async () => tree.update(<Harness />));
  expect(push).toHaveBeenCalledWith({ pathname: "/error", params: { from: "queue", kind: "server" } });
  expect(stop).toHaveBeenCalled();
});
test.each(["permission", "recorder"] as const)("%s error stays inline", async (error) => {
  await mount(); listener.error = error;
  await act(async () => tree.update(<Harness />));
  expect(current.error).toBe(error); expect(push).not.toHaveBeenCalled();
});
test("rejected startup reports a recording error without an unhandled rejection", async () => {
  start.mockRejectedValueOnce(new Error("audio session")); await mount();
  expect(current.error).toBe("recorder"); expect(current.listening).toBe(false);
});
