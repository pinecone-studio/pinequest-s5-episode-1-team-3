import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { strings } from "@/strings";

import { ActionButton } from "./ActionButton";
import { colors, radius, spacing } from "./theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const t = strings.help.card;
const ICON_SIZE = 64;
// Read at arm's length by someone on the other side of a counter.
const MESSAGE_FONT_SIZE = 36;
const REQUEST_FONT_SIZE = 28;

export function StaffCard({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Ionicons name="ear-outline" accessible={false} size={ICON_SIZE} color={colors.primary} />
            <Text accessibilityRole="header" style={styles.message}>{t.message}</Text>
            <Text style={styles.request}>{t.request}</Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <ActionButton label={t.close} icon="close" onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  card: {
    alignItems: "center",
    gap: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.card,
  },
  message: {
    fontSize: MESSAGE_FONT_SIZE,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  request: {
    fontSize: REQUEST_FONT_SIZE,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  footer: { padding: spacing.xl },
});
