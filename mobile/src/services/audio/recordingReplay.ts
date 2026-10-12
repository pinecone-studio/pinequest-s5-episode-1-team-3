import { setAudioModeAsync, type AudioPlayer } from "expo-audio";

import { waitForSpeechLoad } from "./talkPlayback";

export async function replayRecording(player: AudioPlayer, uri: string, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return;
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  if (signal.aborted) return;
  // Replay the same local file that was uploaded, not synthesized speech from the server.
  player.replace({ uri });
  await waitForSpeechLoad(player, signal);
  if (!signal.aborted) player.play();
}
