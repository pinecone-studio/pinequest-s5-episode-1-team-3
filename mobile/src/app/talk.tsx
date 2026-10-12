import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { IncomingTalkPanel } from "@/components/IncomingTalkPanel";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TalkPhraseCard } from "@/components/TalkPhraseCard";
import { TalkSignPreview } from "@/components/TalkSignPreview";
import { colors, fontSize, radius, spacing } from "@/components/theme";
import { useTalkSpeech } from "@/hooks/useTalkSpeech";
import { PHRASE_IDS, type PhraseId } from "@/lib/talk";
import { strings } from "@/strings";

const t = strings.talk;

export default function TalkScreen() {
  const router = useRouter();
  const speech = useTalkSpeech();
  const [previewPhrase, setPreviewPhrase] = useState<PhraseId | null>(null);
  const [incomingBusy, setIncomingBusy] = useState(false);
  const preview = (phrase: PhraseId) => {
    speech.stop();
    setPreviewPhrase(phrase);
  };
  const goBack = () => {
    speech.stop();
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/");
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={goBack} />
      <IncomingTalkPanel onListen={speech.stop} onBusy={setIncomingBusy} />
      <Text style={styles.instruction}>{t.instruction}</Text>
      <Text style={styles.category}>{t.category}</Text>
      {PHRASE_IDS.map((phrase) => <TalkPhraseCard key={phrase} phrase={phrase} selected={speech.selected === phrase} disabled={speech.loading || incomingBusy} onSelect={() => speech.select(phrase)} onSpeak={() => void speech.speak(phrase)} onPreview={() => { if (!incomingBusy) preview(phrase); }} />)}
      <SpeechOutput speech={speech} disabled={incomingBusy} />
      {previewPhrase && <TalkSignPreview phrase={previewPhrase} onClose={() => setPreviewPhrase(null)} />}
      <Text style={styles.source}>{t.source}</Text>
    </ScreenContainer>
  );
}

function SpeechOutput({ speech, disabled }: { speech: ReturnType<typeof useTalkSpeech>; disabled: boolean }) {
  const phrase = speech.selected;
  if (!phrase) return null;
  return (
    <View style={styles.output}>
      <Text style={styles.instruction}>{t.selected}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.selectedText}>{t.phrases[phrase]}</Text>
      {speech.loading && <Text accessibilityLiveRegion="polite" style={styles.instruction}>{t.loading}</Text>}
      {speech.playing && <Text accessibilityLiveRegion="polite" style={styles.instruction}>{t.playing}</Text>}
      {speech.error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.instruction}>{t.errors[speech.error]}</Text>}
      <View style={styles.controls}>
        <View style={styles.control}><ActionButton label={t.repeat} icon="refresh-outline" disabled={speech.loading || disabled} onPress={() => void speech.speak(phrase)} /></View>
        <View style={styles.control}><ActionButton label={t.stop} icon="stop-outline" disabled={!speech.loading && !speech.playing} onPress={speech.stop} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instruction: { fontSize: fontSize.body, color: colors.textMuted },
  category: { alignSelf: "flex-start", padding: spacing.md, backgroundColor: colors.primarySoft, borderRadius: radius.icon, fontSize: fontSize.body, fontWeight: "700", color: colors.primary },
  output: { gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.primarySoft, borderRadius: radius.card },
  selectedText: { fontSize: fontSize.title + spacing.sm, color: colors.text, fontWeight: "800" },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  control: { flexGrow: 1 },
  source: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
