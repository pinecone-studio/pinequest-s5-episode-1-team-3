import { useEvent, useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { config } from "@/config";
import { signVideoUrl } from "@/lib/signDictionary";
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

/** mnsl.mn-ийн дохионуудыг дараалуулан тоглуулна (нэг өгүүлбэрт хэд хэдэн үг). */
export function SignSequence({ words }: { words: readonly string[] }) {
  // Тоглуулах бүрт шинэ player: дараагийн дохио өмнөхийн төгсгөлөөс биш, эхнээс нь эхэлнэ.
  const [position, setPosition] = useState({ index: 0, round: 0 });
  const word = words[position.index];
  const last = position.index === words.length - 1;
  const next = () => { if (!last) setPosition((p) => ({ ...p, index: p.index + 1 })); };
  const replay = () => setPosition((p) => ({ index: 0, round: p.round + 1 }));
  return (
    <View style={styles.sequence}>
      <Text accessibilityLiveRegion="polite" style={styles.word}>
        {word.toLocaleUpperCase("mn")} · {position.index + 1}/{words.length}
      </Text>
      <SignClip key={`${position.round}-${position.index}`} uri={signVideoUrl(word, config.signVideoBaseUrl)} onEnd={next} />
      <Text style={styles.message}>{t.source}</Text>
      {words.length > 1 && <ActionButton label={t.incoming.replaySigns} icon="refresh-outline" variant="soft" onPress={replay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  sequence: { gap: spacing.lg },
  word: { color: colors.text, fontSize: fontSize.title, fontWeight: "700", textAlign: "center" },
  video: { width: "100%", aspectRatio: SIGN_ASPECT_RATIO, backgroundColor: colors.surfaceMuted },
  message: { color: colors.textMuted, fontSize: fontSize.body },
});
