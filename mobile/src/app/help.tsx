import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking } from "react-native";

import { ActionButton } from "@/components/ActionButton";
import { CardRow } from "@/components/CardRow";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StaffCard } from "@/components/StaffCard";
import { config } from "@/config";
import { strings } from "@/strings";

const t = strings.help;

export default function HelpScreen() {
  const router = useRouter();
  const [cardOpen, setCardOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const connect = () => {
    if (!config.interpreterUrl) { setFailed(true); return; }
    setFailed(false);
    // The phone may have no app for this link; say so instead of doing nothing.
    Linking.openURL(config.interpreterUrl).catch(() => setFailed(true));
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t.title}
        backLabel={t.back}
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      />
      <CardRow label={t.interpreter} icon="videocam-outline" />
      <ActionButton label={t.connect} icon="hand-left-outline" onPress={connect} />
      {failed && <ErrorBanner message={t.unavailable} />}
      <CardRow label={t.staffCard} icon="create-outline" onPress={() => setCardOpen(true)} />
      <StaffCard visible={cardOpen} onClose={() => setCardOpen(false)} />
    </ScreenContainer>
  );
}
