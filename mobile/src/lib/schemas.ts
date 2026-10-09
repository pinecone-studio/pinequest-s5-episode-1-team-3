import type { DetectionMatch, DetectionResult, SoundLabel, SoundResult } from "./types";

// Серверийн хариуг шалгаж уншина. Гэрээнд таарахгүй бол null.

const SOUND_LABELS: readonly SoundLabel[] = ["knock", "doorbell", "alarm", "speech", "other"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function parseSound(value: unknown): SoundResult | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isObject(value)) return undefined;
  const label = SOUND_LABELS.find((known) => known === value.label);
  const score = value.score;
  if (!label || typeof score !== "number" || score < 0 || score > 1) return undefined;
  return { label, score };
}

function parseMatch(value: unknown): DetectionMatch | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isObject(value)) return undefined;
  if ((value.type !== "queue" && value.type !== "name") || typeof value.value !== "string") return undefined;
  const window = typeof value.window === "number" ? value.window : null;
  return { type: value.type, value: value.value, window };
}

export function parseDetectionResult(value: unknown): DetectionResult | null {
  if (!isObject(value)) return null;
  const sound = parseSound(value.sound);
  const match = parseMatch(value.match);
  if (sound === undefined || match === undefined) return null;
  const transcript = typeof value.transcript === "string" ? value.transcript : null;
  const latencyMs = typeof value.latencyMs === "number" ? value.latencyMs : 0;
  return { sound, transcript, match, latencyMs };
}
