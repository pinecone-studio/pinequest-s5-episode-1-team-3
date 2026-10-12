import { z } from "zod";

import type { DetectionResult } from "./types";

// Серверийн хариуг шалгаж уншина. Гэрээнд таарахгүй бол null.
const soundSchema = z.object({
  label: z.enum(["knock", "doorbell", "alarm", "speech", "other"]),
  score: z.number().min(0).max(1),
});

const matchSchema = z.object({
  type: z.enum(["queue", "name"]),
  value: z.string(),
  window: z.number().nullable().default(null),
});

export const detectionResultSchema = z.object({
  sound: soundSchema.nullable().default(null),
  transcript: z.string().nullable().default(null),
  match: matchSchema.nullable().default(null),
  latencyMs: z.number().min(0),
});

export function parseDetectionResult(value: unknown): DetectionResult | null {
  const parsed = detectionResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
