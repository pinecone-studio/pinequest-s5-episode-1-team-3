import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "@/components/ActionButton";
import { IncomingTalkPanel } from "@/components/IncomingTalkPanel";
import { PhraseBoard, QuickReplies } from "@/components/PhraseBoard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SignSequence } from "@/components/SignSequence";
import { TalkSignPreview } from "@/components/TalkSignPreview";
import { colors, fontSize, spacing } from "@/components/theme";
import { useIncomingTalk } from "@/hooks/useIncomingTalk";
import { useTalkSpeech } from "@/hooks/useTalkSpeech";
import { BOARD_PHRASES, type BoardPhraseId } from "@/lib/phraseBoard";
import { strings } from "@/strings";

const t = strings.talk;
// Нөгөө хүн утасны дэлгэцийг хол зайнаас уншина. Доор нь дохионы бичлэг багтах ёстой.
const SHOWN_TEXT_SIZE = fontSize.title * 1.5;

export default function TalkScreen() {
  const router = useRouter();
  const speech = useTalkSpeech();
  const incoming = useIncomingTalk();
  const scroll = useRef<ScrollView>(null);
  const [previewPhrase, setPreviewPhrase] = useState<BoardPhraseId | null>(null);
  const [shown, setShown] = useState<BoardPhraseId | null>(null);
  const [incomingBusy, setIncomingBusy] = useState(false);
  const speak = (phrase: BoardPhraseId) => {
    setShown(phrase);
    void speech.speak(phrase);
  };
  const preview = (phrase: BoardPhraseId) => {
    speech.stop();
    setPreviewPhrase(phrase);
  };
  // Хэлсний дараа шууд нөгөө хүний хариуг сонсоно: сонсох хэсэг дээр байгаа тул тийш гүйлгэнэ.
  const listenReply = () => {
    speech.stop();
    setShown(null);
    scroll.current?.scrollTo({ y: 0 });
    void incoming.start();
  };
  const goBack = () => {
    speech.stop();
    if (router.canGoBack()) { router.back(); return; }
    router.replace("/");
  };

  return (
    <ScreenContainer scrollRef={scroll} footer={<QuickReplies selected={speech.selected} disabled={incomingBusy} onSpeak={speak} />}>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={goBack} />
      <IncomingTalkPanel incoming={incoming} onListen={speech.stop} onBusy={setIncomingBusy} />
      <PhraseBoard selected={speech.selected} disabled={incomingBusy} onSpeak={speak} onPreview={preview} />
      {shown && <ShownPhrase phrase={shown} speech={speech} onListenReply={listenReply} onClose={() => { speech.stop(); setShown(null); }} />}
      {previewPhrase && <TalkSignPreview plan={{ kind: "board", phrase: previewPhrase, words: BOARD_PHRASES[previewPhrase].signs }} onClose={() => setPreviewPhrase(null)} />}
      <Text style={styles.source}>{t.source}</Text>
    </ScreenContainer>
  );
}

type ShownProps = { phrase: BoardPhraseId; speech: ReturnType<typeof useTalkSpeech>; onListenReply: () => void; onClose: () => void };

/**
 * Дуу сонсогдохгүй орчинд ч нөгөө хүн уншиж ойлгоно: бичвэрийг бүтэн дэлгэцээр харуулна.
 * Дохионы бичлэг нь хэрэглэгчид зөв өгүүлбэр сонгосноо унших шаардлагагүйгээр баталгаажуулна.
 */
function ShownPhrase({ phrase, speech, onListenReply, onClose }: ShownProps) {
  return (
    <Modal visible animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.shown}>
          <Text style={styles.hint}>{t.selected}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.shownText}>{t.board[phrase]}</Text>
          {speech.playing && <Text accessibilityLiveRegion="polite" style={styles.hint}>{t.playing}</Text>}
          {speech.failed && <Text accessibilityRole="alert" style={styles.hint}>{t.playbackError}</Text>}
          <SignSequence key={phrase} words={BOARD_PHRASES[phrase].signs} />
          <ActionButton label={t.listenReply} icon="mic-outline" onPress={onListenReply} />
          <View style={styles.controls}>
            <View style={styles.control}><ActionButton label={t.repeat} icon="refresh-outline" variant="soft" onPress={() => void speech.speak(phrase)} /></View>
            <View style={styles.control}><ActionButton label={t.close} icon="close-outline" variant="soft" onPress={onClose} /></View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  shown: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  hint: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
  shownText: { fontSize: SHOWN_TEXT_SIZE, fontWeight: "800", color: colors.text, textAlign: "center" },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  control: { flexGrow: 1 },
  source: { fontSize: fontSize.body, color: colors.textMuted, textAlign: "center" },
});
