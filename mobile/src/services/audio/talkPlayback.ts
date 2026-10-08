import type { AudioPlayer } from "expo-audio";

import { SPEECH_TIMEOUT_MS } from "@/lib/talk";

export function waitForSpeechLoad(player: AudioPlayer, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(new Error("cancelled"));
  if (player.isLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      subscription.remove();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => { cleanup(); reject(new Error("cancelled")); };
    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (!status.isLoaded) return;
      cleanup();
      resolve();
    });
    const timer = setTimeout(() => { cleanup(); reject(new Error("audio-load-timeout")); }, SPEECH_TIMEOUT_MS);
    signal.addEventListener("abort", abort);
  });
}
