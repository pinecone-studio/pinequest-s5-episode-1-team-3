import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { type HistoryEntry, type NewHistoryEntry, parseHistoryRow } from "@/lib/history";

const DB_NAME = "signo.db";
// Утсан дээр хязгааргүй өсөхөөс сэргийлнэ. Түүхийн дэлгэцэд үүнээс олныг хэн ч гүйлгэхгүй.
const HISTORY_LIMIT = 200;

let db: Promise<SQLiteDatabase> | null = null;

async function open(): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(DB_NAME);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      ticket TEXT,
      windowNumber INTEGER,
      createdAt INTEGER NOT NULL
    );
  `);
  return database;
}

// Дэлгэц бүр нэг холболтыг хуваалцана. Нээж чадаагүй бол дараагийн удаа дахин оролдоно.
function getDb(): Promise<SQLiteDatabase> {
  db ??= open().catch((cause: unknown) => {
    db = null;
    throw cause;
  });
  return db;
}

export async function addHistory(entry: NewHistoryEntry): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "INSERT INTO history (kind, ticket, windowNumber, createdAt) VALUES (?, ?, ?, ?)",
    entry.kind,
    entry.ticket,
    entry.window,
    entry.createdAt,
  );
  await database.runAsync(
    "DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY createdAt DESC, id DESC LIMIT ?)",
    HISTORY_LIMIT,
  );
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<unknown>(
    "SELECT id, kind, ticket, windowNumber, createdAt FROM history ORDER BY createdAt DESC, id DESC LIMIT ?",
    HISTORY_LIMIT,
  );
  return rows.map(parseHistoryRow).filter((entry): entry is HistoryEntry => entry !== null);
}

export async function clearHistory(): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM history");
}
