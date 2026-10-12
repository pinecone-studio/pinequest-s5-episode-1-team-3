import { type AlertKind, formatTime, isAlertKind } from "./alerts";

export type HistoryMode = "home" | "queue" | "name";

export interface HistoryEntry {
  id: number;
  kind: AlertKind;
  ticket: string | null;
  window: number | null;
  /** Unix мс */
  createdAt: number;
}

export type NewHistoryEntry = Omit<HistoryEntry, "id">;

export interface DayLabels {
  today: string;
  yesterday: string;
}

const MODE_OF: Record<AlertKind, HistoryMode> = {
  knock: "home",
  doorbell: "home",
  alarm: "home",
  queue: "queue",
  name: "name",
};

const DATE_PAD = 2;

export function historyMode(kind: AlertKind): HistoryMode {
  return MODE_OF[kind];
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

// Хоногоор харьцуулна: 23:59-ийн мэдэгдэл 00:01-д «Өчигдөр» гэж харагдах ёстой.
export function formatHistoryTime(createdAt: number, now: Date, labels: DayLabels): string {
  const date = new Date(createdAt);
  const time = formatTime(date);
  const today = startOfDay(now);
  const day = startOfDay(date);
  if (day === today) return `${labels.today} ${time}`;
  if (day === new Date(today).setDate(new Date(today).getDate() - 1)) {
    return `${labels.yesterday} ${time}`;
  }
  const mm = String(date.getMonth() + 1).padStart(DATE_PAD, "0");
  const dd = String(date.getDate()).padStart(DATE_PAD, "0");
  return `${mm}-${dd} ${time}`;
}

// SQLite-ийн мөр (windowNumber багана). Мөр хуучин хувилбарын эсвэл эвдэрсэн байж болно. Таарахгүй мөрийг алгасна.
export function parseHistoryRow(row: unknown): HistoryEntry | null {
  if (typeof row !== "object" || row === null) return null;
  const { id, kind, ticket, windowNumber, createdAt } = row as Record<string, unknown>;
  if (typeof id !== "number" || typeof createdAt !== "number" || !isAlertKind(kind)) return null;
  return {
    id,
    kind,
    ticket: typeof ticket === "string" ? ticket : null,
    window: typeof windowNumber === "number" ? windowNumber : null,
    createdAt,
  };
}
