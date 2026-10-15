import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { useIncomingTalk } from "@/hooks/useIncomingTalk";
import { config } from "@/config";
import { SIGN_VOCABULARY } from "@/lib/signDictionary";
import { planSigns, type SignPlan } from "@/lib/signPlan";
import { strings } from "@/strings";
import { ActionButton } from "./ActionButton";
import { RecordingReplay } from "./RecordingReplay";
import { TalkSignPreview } from "./TalkSignPreview";
import { colors, fontSize, radius, spacing } from "./theme";

const t = strings.talk.incoming;
// Видеоны хаяг тохируулаагүй бол дохио санал болгохгүй: нээгдэхгүй видео харуулахаас бичвэр дээр.
const VOCABULARY: ReadonlySet<string> = config.signVideoBaseUrl ? SIGN_VOCABULARY : new Set();

// incoming-ийг дэлгэц эзэмшинэ: хэрэглэгч өгүүлбэр хэлсний дараа «Хариуг нь сонсох»-оос шууд сонсож эхэлнэ.
type Props = { incoming: ReturnType<typeof useIncomingTalk>; onListen: () => void; onBusy: (busy: boolean) => void };

export function IncomingTalkPanel({ incoming, onListen, onBusy }: Props) {
  const [preview, setPreview] = useState<SignPlan | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [replayBusy, setReplayBusy] = useState(false);
  const match = incoming.transcript ? planSigns(incoming.transcript, VOCABULARY) : null;
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
        {match?.kind === "keywords" && <Text style={styles.text}>{t.keywordsFound}: {match.words.join(", ")}</Text>}
        {match ? <ActionButton label={match.kind === "phrase" ? t.showSign : t.showKeywordSigns} onPress={() => setPreview(match)} />
          : incoming.transcript && <Text style={styles.text}>{t.noMatch}</Text>}
        {match?.kind === "phrase" && match.phrase === "helpQuestion" && <Text style={styles.text}>{t.helpNotice}</Text>}
      </>}
      {shown && <TalkSignPreview plan={shown} onClose={() => { setPreview(null); setDismissed(incoming.transcript); }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.primarySoft, borderRadius: radius.card, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "800" },
  text: { color: colors.textMuted, fontSize: fontSize.body },
});
