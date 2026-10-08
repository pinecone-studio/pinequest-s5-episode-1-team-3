import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { Chip } from "@/components/Chip";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { colors, fontSize, radius, sizes, spacing } from "@/components/theme";
import { strings } from "@/strings";

const t = strings.talk;

const BADGE_ICON_SIZE = 20;

export default function TalkScreen() {
  const router = useRouter();
  const [reply, setReply] = useState("");
  // Design only: showing the reply to the staff member is not wired up yet.
  const showReply = () => undefined;

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.back()} />
      <View style={styles.badge}>
        <Ionicons name="ear-outline" size={BADGE_ICON_SIZE} color={colors.infoText} />
        <Text style={styles.badgeLabel}>{t.staff}</Text>
      </View>
      {/* Sample text for now; becomes the talk mode transcript from the server. */}
      <View accessibilityLiveRegion="polite" style={styles.transcript}>
        <Text style={styles.transcriptText}>{t.sampleTranscript}</Text>
      </View>
      <TextInput
        accessibilityLabel={t.inputLabel}
        value={reply}
        onChangeText={setReply}
        placeholder={t.inputPlaceholder}
        placeholderTextColor={colors.textMuted}
        multiline
        style={styles.input}
      />
      <View style={styles.replies}>
        {t.quickReplies.map((phrase) => (
          <Chip key={phrase} label={phrase} onPress={() => setReply(phrase)} />
        ))}
      </View>
      <ActionButton label={t.show} icon="megaphone-outline" onPress={showReply} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.infoMuted,
    borderRadius: radius.full,
  },
  badgeLabel: { fontSize: fontSize.body, fontWeight: "600", color: colors.infoText },
  transcript: {
    padding: spacing.lg,
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.infoMuted,
    borderRadius: radius.card,
  },
  transcriptText: { fontSize: fontSize.screenTitle, fontWeight: "800", color: colors.text },
  input: {
    minHeight: sizes.minTouch,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  replies: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
