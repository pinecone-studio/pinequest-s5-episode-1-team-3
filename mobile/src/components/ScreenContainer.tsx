import type { ReactNode, Ref } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MAX_CONTENT_WIDTH } from "@/lib/responsive";

import { colors, spacing } from "./theme";

// footer: гүйлгэхэд ч дэлгэцийн доор үргэлж харагдах товчнууд (жишээ нь «Тийм», «Үгүй»).
type Props = { children: ReactNode; footer?: ReactNode; scrollRef?: Ref<ScrollView> };

export function ScreenContainer({ children, footer, scrollRef }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer && <View style={styles.footer}><View style={styles.footerContent}>{footer}</View></View>}
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
  footer: { alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  footerContent: { width: "100%", maxWidth: MAX_CONTENT_WIDTH, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
});