import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { useEffect, useRef, useState } from "react";

import type { BoardPhraseId } from "@/lib/phraseBoard";
import { PHRASE_AUDIO } from "@/services/audio/phraseAudio";
import { waitForSpeechLoad } from "@/services/audio/talkPlayback";

export function useTalkSpeech() {
  // iOS pause must not deactivate the shared session after microphone recording starts.
  const player = useAudioPlayer(null, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const [selected, setSelected] = useState<BoardPhraseId | null>(null);
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const stop = () => {
    request.current?.abort();
    request.current = null;
    player.pause();
  };
  // Дуу апп дотор байгаа тул интернэт, сервер хэрэггүй: Render унтаж байсан ч шууд дуугарна.
  const speak = async (phrase: BoardPhraseId) => {
    stop();
    setSelected(phrase);
    setFailed(false);
    const controller = new AbortController();
    request.current = controller;
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (controller.signal.aborted) return;
      player.replace(PHRASE_AUDIO[phrase]);
      await waitForSpeechLoad(player, controller.signal);
      if (controller.signal.aborted) return;
      await player.seekTo(0);
      player.play();
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    }
  };

  return { selected, playing: status.playing, failed, speak, stop };
}
