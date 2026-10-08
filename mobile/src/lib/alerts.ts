export const ALERT_KINDS = ["knock", "doorbell", "queue", "name"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertIcon =
  | "hand-back-right-outline"
  | "bell-outline"
  | "ticket-confirmation-outline"
  | "account-outline";

export interface AlertConfig {
  icon: AlertIcon;
  title: string;
  /** Дэлгэцийн дэвсгэр өнгө (Figma) */
  color: string;
  /** «Ойлголоо» товч, цонхны картын бичвэрийн өнгө */
  accent: string;
  /** Android pattern: [хүлээх, чичрэх, хүлээх, чичрэх, …] мс */
  vibration: readonly number[];
}

// Шинэ төрлийн мэдэгдэл = энд нэг мөр нэмэх.
// АНХААР: Figma-гийн #E8A33D дээрх цагаан бичвэрийн ялгаа сул (хүртээмжийн дүрэм).
// Хэрэв багийнхан сайжруулах бол зөвхөн энд `color`-ыг бараанаавалаарай.
export const ALERTS: Record<AlertKind, AlertConfig> = {
  knock: {
    icon: "hand-back-right-outline",
    title: "Хаалга тогшлоо",
    color: "#E8A33D",
    accent: "#E8A33D",
    vibration: [0, 200, 100, 200, 100, 200, 800],
  },
  doorbell: {
    icon: "bell-outline",
    title: "Хонх дуугарлаа",
    color: "#4B82EE",
    accent: "#4B82EE",
    vibration: [0, 600, 300, 600, 800],
  },
  queue: {
    icon: "ticket-confirmation-outline",
    title: "Таны ээлж!",
    color: "#4FA556",
    accent: "#3A7D44",
    vibration: [0, 400, 200, 400, 200, 800, 800],
  },
  name: {
    icon: "account-outline",
    title: "Таныг дуудлаа",
    color: "#8A3CDF",
    accent: "#8A3CDF",
    vibration: [0, 300, 150, 300, 150, 300, 800],
  },
};

export function isAlertKind(value: unknown): value is AlertKind {
  return ALERT_KINDS.some((kind) => kind === value);
}

const TIME_PAD = 2;

export function formatTime(date: Date): string {
  const hh = String(date.getHours()).padStart(TIME_PAD, "0");
  const mm = String(date.getMinutes()).padStart(TIME_PAD, "0");
  return `${hh}:${mm}`;
}

// Серверээс ирсэн цонхны дугаар эвдэрсэн байж болно. NaN дэлгэцэнд гарахаас сэргийлнэ.
export function parseWindowNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}