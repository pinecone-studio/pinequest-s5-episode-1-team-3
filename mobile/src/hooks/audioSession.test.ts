import { expect, jest, test } from "@jest/globals";
import { useAudioPlayer } from "expo-audio";

import { RecordingReplay } from "@/components/RecordingReplay";
import { useTalkSpeech } from "./useTalkSpeech";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: () => {},
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => [initial, jest.fn()],
}));
jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(() => ({ pause: jest.fn() })),
  useAudioPlayerStatus: () => ({ playing: false }),
  setAudioModeAsync: jest.fn(),
}));

test("outgoing speech cannot deactivate the microphone session when paused", () => {
  jest.mocked(useAudioPlayer).mockClear();
  useTalkSpeech();
  expect(useAudioPlayer).toHaveBeenCalledWith(null, { keepAudioSessionActive: true });
});

test("recording replay keeps the shared session active for the next recording", () => {
  jest.mocked(useAudioPlayer).mockClear();
  RecordingReplay({ uri: "file:///recording.m4a", onPlay: jest.fn(), onBusy: jest.fn() });
  expect(useAudioPlayer).toHaveBeenCalledWith(null, { keepAudioSessionActive: true });
});
