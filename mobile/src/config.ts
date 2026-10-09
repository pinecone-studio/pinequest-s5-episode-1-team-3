export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
  greetingSignUrl: process.env.EXPO_PUBLIC_GREETING_SIGN_URL ?? "",
  thanksSignUrl: process.env.EXPO_PUBLIC_THANKS_SIGN_URL ?? "",
  interpreterUrl: process.env.EXPO_PUBLIC_INTERPRETER_URL ?? "",
} as const;
