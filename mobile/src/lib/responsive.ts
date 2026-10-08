// Pure layout math. Kept out of components so it can be unit-tested.
export const BASE_WIDTH = 390; // width the design was drawn for
export const MIN_SCALE = 0.9;
export const MAX_SCALE = 1.4;
export const MAX_CONTENT_WIDTH = 720;
export const WIDE_BREAKPOINT = 700;
export const GRID_COLUMN_WIDTH = "48%"; // two columns + gap on wide screens

export type Layout = {
  scale: number;
  isWide: boolean;
};

export function getLayout(width: number): Layout {
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const raw = contentWidth / BASE_WIDTH;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
  return { scale, isWide: width >= WIDE_BREAKPOINT };
}

// Text may grow on big screens but never shrinks below its base size,
// because the accessibility rule requires >= 18pt.
export function scaleFont(base: number, scale: number): number {
  return Math.round(Math.max(base, base * scale));
}

export function scaleSize(base: number, scale: number): number {
  return Math.round(base * scale);
}