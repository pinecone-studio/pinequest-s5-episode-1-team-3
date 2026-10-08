import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";

import { getAlertScale, scaleSize } from "../lib/alertLayout";
import { ALERTS, type AlertKind } from "../lib/alerts";
import {
  type AlertStyles,
  createAlertStyles,
  ICON_SIZE,
  ICON_SIZE_TICKET,
  WHITE,
} from "./alertStyles";

const UNDERSTOOD = "Ойлголоо";
const WINDOW_LABEL = "Цонх";

interface Props {
  kind: AlertKind;
  time: string;
  ticket?: string | null;
  windowNumber?: number | null;
  onDismiss: () => void;
}

export function AlertOverlay({ kind, time, ticket, windowNumber, onDismiss }: Props) {
  const { width, height } = useWindowDimensions();
  const scale = getAlertScale(width, height);
  const styles = useMemo(() => createAlertStyles(scale), [scale]);

  const { icon, title, color, accent } = ALERTS[kind];
  const isQueue = kind === "queue";
  const showTime = kind === "knock" || kind === "doorbell";
  const iconSize = scaleSize(isQueue ? ICON_SIZE_TICKET : ICON_SIZE, scale);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: color }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={WHITE} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        {showTime ? <Text style={styles.time}>{time}</Text> : null}
        {isQueue ? (
          <QueueDetails styles={styles} accent={accent} ticket={ticket} windowNumber={windowNumber} />
        ) : null}

        <Pressable
          style={styles.button}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={UNDERSTOOD}
        >
          <Text style={[styles.buttonText, { color: accent }]}>{UNDERSTOOD}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

interface QueueProps {
  styles: AlertStyles;
  accent: string;
  ticket?: string | null;
  windowNumber?: number | null;
}

function QueueDetails({ styles, accent, ticket, windowNumber }: QueueProps) {
  return (
    <>
      {ticket ? (
        <View style={styles.pill}>
          <Text style={styles.pillText}>{ticket}</Text>
        </View>
      ) : null}
      {windowNumber != null ? (
        <View style={styles.windowCard}>
          <Text style={[styles.windowLabel, { color: accent }]}>{WINDOW_LABEL}</Text>
          <Text style={[styles.windowNumber, { color: accent }]}>{windowNumber}</Text>
        </View>
      ) : null}
    </>
  );
}