import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { colors, fontSize, radius, sizes, spacing } from "@/components/theme";
import type { PhraseId } from "@/lib/talk";
import { strings } from "@/strings";

const t = strings.talk;
const SIGN_ASPECT_RATIO = 960 / 390;
const ILLUSTRATIONS: Record<PhraseId, number> = {
  greeting: require("../../assets/images/signGreetingSequence.svg"),
  thanks: require("../../assets/images/signThanksSequence.svg"),
};

type Props = {
  phrase: PhraseId;
  selected: boolean;
  disabled: boolean;
  onSpeak: () => void;
  onSelect: () => void;
  onPreview: () => void;
};

export function TalkPhraseCard({ phrase, selected, disabled, onSpeak, onSelect, onPreview }: Props) {
  return (
    <View style={[styles.card, selected && styles.selected]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t.phrases[phrase]} accessibilityState={{ selected }} onPress={onSelect} style={({ pressed }) => [styles.selectArea, pressed && styles.selectPressed]}>
        <Image source={ILLUSTRATIONS[phrase]} contentFit="contain" style={styles.illustration} accessible={false} />
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${t.watchSign}: ${t.phrases[phrase]}`} onPress={onPreview} style={({ pressed }) => [styles.preview, pressed && styles.pressed]}>
          <Ionicons name="play-circle" size={fontSize.screenTitle} color={colors.infoText} accessible={false} />
          <Text style={styles.previewText}>{t.watchSign}</Text>
        </Pressable>
        <View style={styles.speak}><ActionButton label={t.speak} disabled={disabled} onPress={onSpeak} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.infoSoft, borderRadius: radius.card, padding: spacing.md, gap: spacing.md, borderWidth: spacing.xs, borderColor: colors.infoSoft },
  selected: { borderColor: colors.primary },
  selectArea: { minHeight: sizes.minTouch, borderRadius: radius.icon, overflow: "hidden", backgroundColor: colors.infoSoft },
  selectPressed: { backgroundColor: colors.primarySoft },
  preview: { flexGrow: 1, flexBasis: sizes.minTouch * 2, minHeight: sizes.minTouch, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.xs, padding: spacing.sm, borderRadius: radius.icon, backgroundColor: colors.infoMuted },
  illustration: { width: "100%", aspectRatio: SIGN_ASPECT_RATIO },
  previewText: { fontSize: fontSize.body, fontWeight: "700", color: colors.infoText, textAlign: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  speak: { flexGrow: 1, flexBasis: sizes.minTouch * 2 },
  pressed: { opacity: 0.7 },
});
