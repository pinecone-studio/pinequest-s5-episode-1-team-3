import { strings } from "@/strings";
import { ALERTS, type AlertKind } from "./alerts";

const t = strings.history;
// Апп асаалттай байх хугацаанд л хадгална: утсанд хадгалах сан (AsyncStorage) шинэ APK шаарддаг.
const MAX_ENTRIES = 50;

export type HistoryEntry = { id: number; kind: AlertKind; at: Date; ticket: string | null; window: number | null };

let entries: readonly HistoryEntry[] = [];
const listeners = new Set<() => void>();

/** Шинэ мэдэгдлийг жагсаалтын эхэнд нэмнэ. */
export function addHistory(entry: Omit<HistoryEntry, "id">): void {
  entries = [{ ...entry, id: (entries[0]?.id ?? 0) + 1 }, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach((listener) => listener());
}

export const getHistory = (): readonly HistoryEntry[] => entries;

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Дугаарт «24 дугаар · 3-р цонх», бусдад мэдэгдлийн гарчиг. */
export function historyTitle({ kind, ticket, window }: HistoryEntry): string {
  if (kind !== "queue" || !ticket) return ALERTS[kind].title;
  return window === null ? `${ticket} ${t.ticket}` : `${ticket} ${t.ticket} · ${window}${t.window}`;
}
