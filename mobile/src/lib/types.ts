// API гэрээ (AGENTS.md → API гэрээ). server/app/schemas.py-тэй ЯГ таарна.

export type DetectMode = "home" | "queue" | "name" | "talk";
export type SoundLabel = "knock" | "doorbell" | "alarm" | "speech" | "other";

export interface SoundResult {
  label: SoundLabel;
  score: number;
}

export interface DetectionMatch {
  type: "queue" | "name";
  value: string;
  window: number | null;
}

export interface DetectionResult {
  sound: SoundResult | null;
  transcript: string | null;
  match: DetectionMatch | null;
  latencyMs: number;
}

export interface DetectRequest {
  audioUri: string;
  mode: DetectMode;
  ticket?: string;
  name?: string;
}
