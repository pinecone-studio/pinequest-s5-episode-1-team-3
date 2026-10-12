import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { config } from "@/config";
import type { IncomingSignId } from "@/lib/incomingSigns";
import { strings } from "@/strings";

import { ActionButton } from "./ActionButton";
import { colors, fontSize, spacing } from "./theme";

const t = strings.talk;
const SIGN_ASPECT_RATIO = 4 / 3;

export function TalkSignPreview({ phrase, onClose }: { phrase: IncomingSignId; onClose: () => void }) {
  const urls: Record<IncomingSignId, string> = { greeting: config.greetingSignUrl, thanks: config.thanksSignUrl,
    sorry: config.sorrySignUrl, goodbye: config.goodbyeSignUrl, helpQuestion: config.helpSignUrl };
  const uri = urls[phrase];
  const player = useVideoPlayer(uri || null, (video) => {
    video.muted = true;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });
  useEffect(() => {
    if (status === "readyToPlay") player.play();
  }, [player, status]);
  const close = () => { player.pause(); onClose(); };

  return (
    <Modal visible animationType="none" onRequestClose={close}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{t.incoming.phrases[phrase]}</Text>
          {phrase === "helpQuestion" && <Text style={styles.message}>{t.incoming.helpNotice}</Text>}
          <VideoView player={player} nativeControls contentFit="contain" style={styles.video} />
          {status === "loading" && <Text accessibilityLiveRegion="polite" style={styles.message}>{t.videoLoading}</Text>}
          {(!uri || status === "error") && <Text accessibilityRole="alert" style={styles.message}>{t.signUnavailable}</Text>}
          <Text style={styles.message}>{t.source}</Text>
          <ActionButton label={t.close} icon="close-outline" onPress={close} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: "800" },
  video: { width: "100%", aspectRatio: SIGN_ASPECT_RATIO, backgroundColor: colors.surfaceMuted },
  message: { color: colors.textMuted, fontSize: fontSize.body },
});
