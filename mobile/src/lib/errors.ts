export const ERROR_KINDS = ["network", "server"] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

// Screens that talk to the server and can therefore land on the error screen.
export const ERROR_SOURCES = ["home", "queue", "name", "talk"] as const;
export type ErrorSource = (typeof ERROR_SOURCES)[number];

// Route params arrive as free text (deep links included), so both are checked.
export function isErrorKind(value: unknown): value is ErrorKind {
  return ERROR_KINDS.some((kind) => kind === value);
}

export function isErrorSource(value: unknown): value is ErrorSource {
  return ERROR_SOURCES.some((source) => source === value);
}
