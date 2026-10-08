import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MAX_CONTENT_WIDTH } from "@/lib/responsive";

import { colors, spacing } from "./theme";

type Props = { children: ReactNode };

export function ScreenContainer({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  // alignItems centers the capped-width column on tablets and web.
  scroll: { flexGrow: 1, alignItems: "center" },
  content: {
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    padding: spacing.xl,
    gap: spacing.lg,
  },
});