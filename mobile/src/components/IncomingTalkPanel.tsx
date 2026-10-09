import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useIncomingTalk } from "@/hooks/useIncomingTalk";
import { matchIncomingSign, type IncomingSignId } from "@/lib/incomingSigns";
import { strings } from "@/strings";
import { ActionButton } from "./ActionButton";
import { RecordingReplay } from "./RecordingReplay";
import { TalkSignPreview } from "./TalkSignPreview";
import { colors, fontSize, radius, spacing } from "./theme";

const t = strings.talk.incoming;

export function IncomingTalkPanel({ onListen, onBusy }: { onListen: () => void; onBusy: (busy: boolean) => void }) {
  const incoming = useIncomingTalk();
  const [preview, setPreview] = useState<IncomingSignId | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [replayBusy, setReplayBusy] = useState(false);
  const match = incoming.transcript ? matchIncomingSign(incoming.transcript) : null;
  const shown = preview ?? (incoming.transcript !== dismissed ? match : null);
  useEffect(() => { onBusy(incoming.busy || replayBusy); }, [incoming.busy, replayBusy, onBusy]);
  const listen = () => { onListen(); setPreview(null); setDismissed(null); void incoming.start(); };
  const error = incoming.error;
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{t.title}</Text>
      <Text style={styles.text}>{t.instruction}</Text>
      <Text style={styles.text}>{t.privacy}</Text>
      {incoming.phase !== "idle" && <Text accessibilityLiveRegion="polite" style={styles.text}>{t[incoming.phase]}</Text>}
      <ActionButton label={incoming.phase === "recording" ? t.finish : t.listen} icon="mic-outline" disabled={replayBusy || incoming.phase === "preparing" || incoming.phase === "processing"}
        onPress={incoming.phase === "recording" ? () => void incoming.finish() : listen} />
      {incoming.busy && <ActionButton label={t.cancel} onPress={incoming.cancel} />}
      {error && <Text accessibilityRole="alert" style={styles.text}>{t.errors[error]}</Text>}
      {incoming.errorDetails && <Text selectable style={styles.text}>{t.recordingDetails}: {incoming.errorDetails}</Text>}
      {incoming.recordingUri && !incoming.busy && <RecordingReplay key={incoming.recordingUri} uri={incoming.recordingUri} onPlay={onListen} onBusy={setReplayBusy} />}
      {incoming.transcript !== null && <>
        <Text style={styles.text}>{t.transcript}</Text>
        <Text accessibilityLiveRegion="polite" style={styles.title}>{incoming.transcript || t.empty}</Text>
        {match ? <ActionButton label={t.showSign} onPress={() => setPreview(match)} /> : incoming.transcript && <Text style={styles.text}>{t.noMatch}</Text>}
        {match === "helpQuestion" && <Text style={styles.text}>{t.helpNotice}</Text>}
      </>}
      {shown && <TalkSignPreview phrase={shown} onClose={() => { setPreview(null); setDismissed(incoming.transcript); }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.primarySoft, borderRadius: radius.card, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "800" },
  text: { color: colors.textMuted, fontSize: fontSize.body },
});
