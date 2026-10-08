const TICKET_DIGITS = 3;
const TICKET_PATTERN = /^(?:([А-ЯӨҮЁA-Z])\s*-?\s*)?(\d{1,3})$/u;

// Latin lookalikes are common when users enter tickets with an English keyboard.
const CYRILLIC_LOOKALIKES: Readonly<Record<string, string>> = {
  A: "А", B: "В", C: "С", E: "Е", H: "Н", K: "К", M: "М",
  O: "О", P: "Р", T: "Т", X: "Х", Y: "У",
};

export function normalizeTicket(input: string): string | null {
  const match = TICKET_PATTERN.exec(input.trim().toUpperCase());
  if (!match) return null;

  const [, letter, digits] = match;
  const number = digits.padStart(TICKET_DIGITS, "0");
  if (!letter) return number;

  const prefix = CYRILLIC_LOOKALIKES[letter] ?? letter;
  return `${prefix}-${number}`;
}
