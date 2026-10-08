// Figma-н дэлгэцийн хэмжээ. Бусад дэлгэц үүнтэй харьцуулан томорч, багасна.
const BASE_WIDTH = 390;
const BASE_HEIGHT = 780;

export const MIN_SCALE = 0.7;
export const MAX_SCALE = 1.3;
export const MAX_CONTENT_WIDTH = 480;

// Хүртээмжийн дүрэм (AGENTS.md): бичвэр ≥ 18, товч ≥ 56. Жижиг утсан дээр ч үүнээс багасгахгүй.
export const MIN_FONT = 18;
export const MIN_BUTTON = 56;

export function getAlertScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  const raw = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

export function scaleSize(value: number, scale: number, min = 0): number {
  return Math.max(min, Math.round(value * scale));
}