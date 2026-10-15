import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SignPlan } from "@/lib/signPlan";
import { strings } from "@/strings";

import { ActionButton } from "./ActionButton";
import { SignSequence } from "./SignSequence";
import { colors, fontSize, spacing } from "./theme";

const t = strings.talk;

export function TalkSignPreview({ plan, onClose }: { plan: SignPlan; onClose: () => void }) {
  const title = plan.kind === "phrase" ? t.incoming.phrases[plan.phrase]
    : plan.kind === "board" ? t.board[plan.phrase] : t.incoming.keywordsTitle;

  return (
    <Modal visible animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          {plan.kind === "keywords" && <Text style={styles.message}>{t.incoming.keywordsNotice}</Text>}
          {plan.kind === "phrase" && plan.phrase === "helpQuestion" && <Text style={styles.message}>{t.incoming.helpNotice}</Text>}
          <SignSequence words={plan.words} />
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
  message: { color: colors.textMuted, fontSize: fontSize.body },
});
