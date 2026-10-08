import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ListRow } from "@/components/ListRow";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ToggleRow } from "@/components/ToggleRow";
import { colors, fontSize } from "@/components/theme";
import { strings } from "@/strings";

const t = strings.settings;

type AlertKey = "vibration" | "color" | "light";
type TextSize = keyof typeof t.textSizes;

const INITIAL_ALERTS: Record<AlertKey, boolean> = {
  vibration: true,
  color: true,
  light: true,
};

export default function SettingsScreen() {
  const router = useRouter();
  // Local state for now; persist through services/storage once it exists.
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [textSize, setTextSize] = useState<TextSize>("large");

  const setAlert = (key: AlertKey) => (value: boolean) =>
    setAlerts((prev) => ({ ...prev, [key]: value }));
  const toggleTextSize = () =>
    setTextSize((prev) => (prev === "large" ? "xlarge" : "large"));

  return (
    <ScreenContainer>
      <ScreenHeader title={t.title} backLabel={t.back} onBack={() => router.back()} />
      <Text accessibilityRole="header" style={styles.section}>{t.alerts}</Text>
      <ToggleRow label={t.vibration} icon="phone-portrait-outline" value={alerts.vibration} onValueChange={setAlert("vibration")} />
      <ToggleRow label={t.color} icon="color-palette-outline" value={alerts.color} onValueChange={setAlert("color")} />
      <ToggleRow label={t.light} icon="flashlight-outline" value={alerts.light} onValueChange={setAlert("light")} />
      <Text accessibilityRole="header" style={styles.section}>{t.appearance}</Text>
      <ListRow
        title={t.textSize}
        subtitle={t.textSizes[textSize]}
        icon="text"
        color={colors.primarySoft}
        iconColor={colors.text}
        onPress={toggleTextSize}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: fontSize.body, fontWeight: "700", color: colors.text },
});
