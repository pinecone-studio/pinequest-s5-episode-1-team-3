import { beforeEach, expect, jest, test } from "@jest/globals";
import { setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { waitForSpeechLoad } from "./talkPlayback";
import { replayRecording } from "./recordingReplay";

jest.mock("expo-audio", () => ({ setAudioModeAsync: jest.fn() }));
jest.mock("./talkPlayback", () => ({ waitForSpeechLoad: jest.fn() }));
const player = { replace: jest.fn(), play: jest.fn() };
const audioPlayer = player as unknown as AudioPlayer;
beforeEach(() => { jest.clearAllMocks(); });

test("replays the uploaded local recording without a server request", async () => {
  await replayRecording(audioPlayer, "file:///recording.m4a", new AbortController().signal);
  expect(setAudioModeAsync).toHaveBeenCalledWith({ allowsRecording: false, playsInSilentMode: true });
  expect(player.replace).toHaveBeenCalledWith({ uri: "file:///recording.m4a" });
  expect(waitForSpeechLoad).toHaveBeenCalled();
  expect(player.play).toHaveBeenCalledTimes(1);
});

test("does not play when cancelled before starting", async () => {
  const controller = new AbortController(); controller.abort();
  await replayRecording(audioPlayer, "file:///recording.m4a", controller.signal);
  expect(player.replace).not.toHaveBeenCalled();
  expect(player.play).not.toHaveBeenCalled();
});

test("cancellation while loading prevents playback", async () => {
  const controller = new AbortController();
  jest.mocked(waitForSpeechLoad).mockImplementationOnce(async () => { controller.abort(); });
  await replayRecording(audioPlayer, "file:///recording.m4a", controller.signal);
  expect(player.play).not.toHaveBeenCalled();
});

test("load failure propagates so the UI can explain it", async () => {
  jest.mocked(waitForSpeechLoad).mockRejectedValueOnce(new Error("audio-load-timeout"));
  await expect(replayRecording(audioPlayer, "file:///recording.m4a", new AbortController().signal)).rejects.toThrow("audio-load-timeout");
  expect(player.play).not.toHaveBeenCalled();
});
