import { afterEach, expect, jest, test } from "@jest/globals";
import type { AudioRecorder } from "expo-audio";
import { MicrophonePermissionError, MicrophoneSetupError, startTalkRecording } from "./talkRecording";

const mockPermission = jest.fn<() => Promise<{ granted: boolean }>>();
const mockMode = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
jest.mock("expo-audio", () => ({ requestRecordingPermissionsAsync: () => mockPermission(), setAudioModeAsync: () => mockMode() }));
afterEach(() => { jest.clearAllMocks(); });

test("never records without microphone permission", async () => {
  mockPermission.mockResolvedValue({ granted: false });
  const recorder = { prepareToRecordAsync: jest.fn(), record: jest.fn() } as unknown as AudioRecorder;
  await expect(startTalkRecording(recorder, new AbortController().signal)).rejects.toBeInstanceOf(MicrophonePermissionError);
  expect(recorder.record).not.toHaveBeenCalled();
  expect(mockMode).not.toHaveBeenCalled();
});

test("a cancelled permission request never starts recording", async () => {
  mockPermission.mockResolvedValue({ granted: true });
  const controller = new AbortController(); controller.abort();
  const recorder = { prepareToRecordAsync: jest.fn(), record: jest.fn() } as unknown as AudioRecorder;
  await startTalkRecording(recorder, controller.signal);
  expect(recorder.record).not.toHaveBeenCalled();
});

test("stops a recorder if cancellation arrives during preparation", async () => {
  mockPermission.mockResolvedValue({ granted: true });
  const controller = new AbortController();
  const recorder = { prepareToRecordAsync: jest.fn(async () => controller.abort()), record: jest.fn(), stop: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) } as unknown as AudioRecorder;
  await startTalkRecording(recorder, controller.signal);
  expect(recorder.record).not.toHaveBeenCalled();
  expect(recorder.stop).toHaveBeenCalledTimes(1);
});

test("starts using the basic recording API", async () => {
  mockPermission.mockResolvedValue({ granted: true });
  const recorder = { prepareToRecordAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined), record: jest.fn() } as unknown as AudioRecorder;
  await startTalkRecording(recorder, new AbortController().signal);
  expect(recorder.record).toHaveBeenCalledWith();
});

test("preparation errors are microphone errors, not server connectivity failures", async () => {
  mockPermission.mockResolvedValue({ granted: true });
  const recorder = { prepareToRecordAsync: jest.fn<() => Promise<void>>().mockRejectedValue(new Error("Cannot prepare recorder")), record: jest.fn() } as unknown as AudioRecorder;
  await expect(startTalkRecording(recorder, new AbortController().signal)).rejects.toBeInstanceOf(MicrophoneSetupError);
  await expect(startTalkRecording(recorder, new AbortController().signal)).rejects.toThrow("prepare: Cannot prepare recorder");
  expect(recorder.record).not.toHaveBeenCalled();
});
