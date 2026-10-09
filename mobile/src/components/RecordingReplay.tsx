import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Text } from "react-native";

import { replayRecording } from "@/services/audio/recordingReplay";
import { strings } from "@/strings";
import { ActionButton } from "./ActionButton";
import { colors, fontSize } from "./theme";

const t = strings.talk.incoming;

export function RecordingReplay({ uri, onPlay, onBusy }: { uri: string; onPlay: () => void; onBusy: (busy: boolean) => void }) {
  // This player shares the session with the microphone and outgoing speech player.
  const player = useAudioPlayer(null, { keepAudioSessionActive: true });
  const status = useAudioPlayerStatus(player);
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const busy = loading || status.playing;
  useEffect(() => { onBusy(busy); }, [busy, onBusy]);
  useEffect(() => () => { request.current?.abort(); onBusy(false); }, [onBusy]);
  const stop = () => { request.current?.abort(); player.pause(); setLoading(false); };
  const play = async () => {
    onPlay(); setLoading(true); setFailed(false);
    const controller = new AbortController(); request.current = controller;
    try { await replayRecording(player, uri, controller.signal); }
    catch { if (!controller.signal.aborted) setFailed(true); }
    finally { if (request.current === controller) setLoading(false); }
  };
  return <>
    <Text style={{ color: colors.textMuted, fontSize: fontSize.body }}>{t.replayHint}</Text>
    <ActionButton label={busy ? t.replayStop : t.replay} icon={busy ? "stop-outline" : "play-outline"}
      onPress={busy ? stop : () => void play()} />
    {loading && <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted, fontSize: fontSize.body }}>{t.replayLoading}</Text>}
    {failed && <Text accessibilityRole="alert" style={{ color: colors.textMuted, fontSize: fontSize.body }}>{t.replayError}</Text>}
  </>;
}
