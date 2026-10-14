import { useEffect } from "react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { requestRecordingPermissionsAsync, useAudioRecorder } from "expo-audio";
import { detector } from "@/services/detector";
import { useListener } from "./useListener";

jest.mock("expo-audio", () => ({
  useAudioRecorder: jest.fn(), RecordingPresets: { HIGH_QUALITY: {} },
  requestRecordingPermissionsAsync: jest.fn(), setAudioModeAsync: jest.fn(),
}));
jest.mock("@/services/detector", () => ({ detector: { detect: jest.fn() }, DetectorError: class extends Error {} }));
const recorder = {
  prepareToRecordAsync: jest.fn<() => Promise<void>>().mockResolvedValue(),
  record: jest.fn(), stop: jest.fn<() => Promise<void>>().mockResolvedValue(), uri: "file:///clip.m4a",
};
let listener: ReturnType<typeof useListener>;
let tree: ReactTestRenderer;
function Harness() { const value = useListener({ mode: "queue", ticket: "А-024", onResult: jest.fn() }); useEffect(() => { listener = value; }); return null; }
beforeEach(async () => {
  jest.clearAllMocks(); jest.useFakeTimers();
  jest.mocked(useAudioRecorder).mockReturnValue(recorder as unknown as ReturnType<typeof useAudioRecorder>);
  jest.mocked(requestRecordingPermissionsAsync).mockResolvedValue({ granted: true } as Awaited<ReturnType<typeof requestRecordingPermissionsAsync>>);
  await act(async () => { tree = create(<Harness />); });
});
afterEach(async () => { await act(async () => tree.unmount()); jest.useRealTimers(); });

test("stop ends an active chunk immediately and never uploads it", async () => {
  await act(async () => listener.start());
  expect(recorder.record).toHaveBeenCalledTimes(1);
  await act(async () => listener.stop());
  expect(recorder.stop).toHaveBeenCalledTimes(1);
  expect(detector.detect).not.toHaveBeenCalled();
});
test("leaving during microphone permission cannot start recording later", async () => {
  let grant!: (permission: Awaited<ReturnType<typeof requestRecordingPermissionsAsync>>) => void;
  jest.mocked(requestRecordingPermissionsAsync).mockReturnValueOnce(new Promise((resolve) => { grant = resolve; }));
  let startup!: Promise<void>;
  act(() => { startup = listener.start(); });
  await act(async () => listener.stop());
  await act(async () => { grant({ granted: true } as Awaited<ReturnType<typeof requestRecordingPermissionsAsync>>); await startup; });
  expect(recorder.prepareToRecordAsync).not.toHaveBeenCalled();
  expect(listener.listening).toBe(false);
});
test("rapid restart discards the old chunk instead of uploading it as the new session", async () => {
  await act(async () => listener.start());
  await act(async () => { listener.stop(); await listener.start(); });
  expect(detector.detect).not.toHaveBeenCalled();
  expect(recorder.record).toHaveBeenCalledTimes(2);
  await act(async () => listener.stop());
});
