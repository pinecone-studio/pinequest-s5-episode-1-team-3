import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import { useEffect, useRef, useState } from "react";

import type { PhraseId } from "@/lib/talk";
import { waitForSpeechLoad } from "@/services/audio/talkPlayback";
import { prepareSpeech, SpeechRequestError, type SpeechErrorCode } from "@/services/detector/talkSpeech";

export function useTalkSpeech() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [selected, setSelected] = useState<PhraseId | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  const stop = () => {
    request.current?.abort();
    request.current = null;
    player.pause();
    setLoading(false);
  };
  const speak = async (phrase: PhraseId) => {
    stop();
    setSelected(phrase);
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    request.current = controller;
    try {
      const uri = await prepareSpeech(phrase, controller.signal);
      if (controller.signal.aborted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      if (controller.signal.aborted) return;
      player.replace({ uri });
      await waitForSpeechLoad(player, controller.signal);
      if (controller.signal.aborted) return;
      player.play();
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof SpeechRequestError ? cause.code : "network");
    } finally {
      if (request.current === controller) setLoading(false);
    }
  };

  return { selected, loading, playing: status.playing, error, speak, stop,
    select: (phrase: PhraseId) => { stop(); setError(null); setSelected(phrase); } };
}
