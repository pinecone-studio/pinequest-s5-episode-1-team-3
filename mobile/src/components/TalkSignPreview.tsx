import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { config } from "@/config";
import { signVideoUrl } from "@/lib/signDictionary";
import type { SignPlan } from "@/lib/signPlan";
import { strings } from "@/strings";

import { ActionButton } from "./ActionButton";
import { colors, fontSize, spacing } from "./theme";

const t = strings.talk;
const SIGN_ASPECT_RATIO = 4 / 3;

function SignClip({ uri, onEnd }: { uri: string; onEnd: () => void }) {
  const player = useVideoPlayer(uri || null, (video) => {
    video.muted = true;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  useEffect(() => {
    if (status === "readyToPlay") player.play();
  }, [player, status]);
  useEventListener(player, "playToEnd", onEnd);
  return (
    <>
      <VideoView player={player} nativeControls contentFit="contain" style={styles.video} />
      {status === "loading" && <Text accessibilityLiveRegion="polite" style={styles.message}>{t.videoLoading}</Text>}
      {(!uri || status === "error") && <Text accessibilityRole="alert" style={styles.message}>{t.signUnavailable}</Text>}
    </>
  );
}

export function TalkSignPreview({ plan, onClose }: { plan: SignPlan; onClose: () => void }) {
  // Тоглуулах бүрт шинэ player: дараагийн дохио өмнөхийн төгсгөлөөс биш, эхнээс нь эхэлнэ.
  const [position, setPosition] = useState({ index: 0, round: 0 });
  const word = plan.words[position.index];
  const last = position.index === plan.words.length - 1;
  const next = () => { if (!last) setPosition((p) => ({ ...p, index: p.index + 1 })); };
  const replay = () => setPosition((p) => ({ index: 0, round: p.round + 1 }));
  const title = plan.kind === "phrase" ? t.incoming.phrases[plan.phrase] : t.incoming.keywordsTitle;

  return (
    <Modal visible animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {plan.kind === "keywords" && <Text style={styles.message}>{t.incoming.keywordsNotice}</Text>}
          {plan.kind === "phrase" && plan.phrase === "helpQuestion" && <Text style={styles.message}>{t.incoming.helpNotice}</Text>}
          <Text accessibilityLiveRegion="polite" style={styles.word}>
            {word.toLocaleUpperCase("mn")} · {position.index + 1}/{plan.words.length}
          </Text>
          <SignClip key={`${position.round}-${position.index}`} uri={signVideoUrl(word, config.signVideoBaseUrl)} onEnd={next} />
          <Text style={styles.message}>{t.source}</Text>
          {plan.words.length > 1 && <ActionButton label={t.incoming.replaySigns} icon="refresh-outline" variant="soft" onPress={replay} />}
          <ActionButton label={t.close} icon="close-outline" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "800" },
  word: { color: colors.text, fontSize: fontSize.title, fontWeight: "700", textAlign: "center" },
  video: { width: "100%", aspectRatio: SIGN_ASPECT_RATIO, backgroundColor: colors.surfaceMuted },
  message: { color: colors.textMuted, fontSize: fontSize.body },
});
