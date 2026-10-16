export const ALERT_KINDS = ["knock", "doorbell", "alarm", "queue", "name"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertIcon =
  | "hand-back-right-outline"
  | "bell-outline"
  | "alarm-light-outline"
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
  /** Дэлгэц анивчих эсэх: утас руу харахгүй байсан ч нүдний булангаар анзаарна */
  flash: boolean;
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
    flash: true,
  },
  doorbell: {
    icon: "bell-outline",
    title: "Хонх дуугарлаа",
    color: "#4B82EE",
    accent: "#4B82EE",
    vibration: [0, 600, 300, 600, 800],
    flash: true,
  },
  alarm: {
    icon: "alarm-light-outline",
    title: "Сэрүүлэг дуугарлаа",
    color: "#C62828",
    accent: "#C62828",
    vibration: [0, 800, 200, 800, 200, 800, 800],
    flash: true,
  },
  queue: {
    icon: "ticket-confirmation-outline",
    title: "Таны ээлж!",
    color: "#4FA556",
    accent: "#3A7D44",
    vibration: [0, 400, 200, 400, 200, 800, 800],
    // Дугаар, цонхыг уншихад саад болохгүй: дарааллыг анивчуулахгүй.
    flash: false,
  },
  name: {
    icon: "account-outline",
    title: "Таныг дуудлаа",
    color: "#8A3CDF",
    accent: "#8A3CDF",
    vibration: [0, 300, 150, 300, 150, 300, 800],
    flash: true,
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