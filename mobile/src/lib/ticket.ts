// Монголд дарааллын зарлалд үсэг дууддаггүй тул зөвхөн дугаар авна.
// Эхний тэгийг хасна: «015» → «15». Зарлалд «арван тав», «тэг нэг тав» аль нь ч 15-тай таарна.
const TICKET_PATTERN = /^\d{1,3}$/;

export function normalizeTicket(input: string): string | null {
  const digits = input.trim();
  if (!TICKET_PATTERN.test(digits)) return null;
  return String(Number(digits));
}
