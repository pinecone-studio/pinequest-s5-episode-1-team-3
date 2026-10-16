import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "expo-router";
import { Modal, Pressable, StyleSheet, Text } from "react-native";

import { strings } from "@/strings";
import { fontSize, spacing } from "./theme";

const t = strings.standby;
// Хар дэвсгэр OLED дэлгэцэд бараг цэнэг зарцуулахгүй. Бичвэр бүдэг: харанхуй өрөөнд гялбахгүй.
const BLACK = "#000000";
const DIM = "rgba(255, 255, 255, 0.45)";
const ICON_SIZE = 48;

/**
 * «Хүлээх горим»: дэлгэц хар, унтрахгүй, сонсох үргэлжилнэ. Дэлгэцийн дурын газар дарвал гарна.
 * Мэдэгдлийн дэлгэц нээгдэхэд нуугдана (Modal бүх дэлгэцийн дээр гардаг), буцахад дахин гарна.
 */
export function StandbyOverlay({ onExit }: { onExit: () => void }) {
  const focused = useIsFocused();
  if (!focused) return null;
  return (
    <Modal visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onExit}>
      <Pressable style={styles.screen} onPress={onExit} accessibilityRole="button" accessibilityLabel={t.exit}>
        <Ionicons name="ear-outline" size={ICON_SIZE} color={DIM} accessible={false} />
        <Text style={styles.title}>{t.listening}</Text>
        <Text style={styles.hint}>{t.hint}</Text>
        <Text style={styles.hint}>{t.exit}</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BLACK, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  title: { fontSize: fontSize.title, fontWeight: "700", color: DIM },
  hint: { fontSize: fontSize.body, color: DIM, textAlign: "center" },
});
