// Single source for colors and sizes so screens contain no magic numbers.
export const colors = {
  background: "#FFFFFF",
  surface: "#F9FAFB",
  surfaceMuted: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  textMuted: "#4B5563",
  primary: "#4F46E5",
  primarySoft: "#EEF0FF",
  info: "#3B82F6",
  infoSoft: "#F0F9FF",
  infoMuted: "#DBEAFE",
  infoText: "#075985",
  success: "#4BA257",
  successRing: "#C8E6CF",
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  dangerBorder: "#FECACA",
  switchOff: "#D1D5DB",
  white: "#FFFFFF",
  mode: {
    home: "#E8A23A",
    queue: "#4BA257",
    name: "#9333EA",
    talk: "#3B9CE0",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  card: 16,
  icon: 12,
  pill: 14,
  full: 999,
} as const;

export const fontSize = {
  body: 18,
  title: 28,
  screenTitle: 24,
} as const;

export const sizes = {
  minTouch: 56, // accessibility rule: buttons >= 56px
  modeCardHeight: 92,
  modeIcon: 56,
  listenCircle: 160,
  listenRing: 8,
  listenIcon: 36,
  itemIcon: 44,
} as const;