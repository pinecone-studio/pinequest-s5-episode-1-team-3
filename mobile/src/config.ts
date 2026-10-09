export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, ""),
  greetingSignUrl: process.env.EXPO_PUBLIC_GREETING_SIGN_URL ?? "",
  thanksSignUrl: process.env.EXPO_PUBLIC_THANKS_SIGN_URL ?? "",
  sorrySignUrl: process.env.EXPO_PUBLIC_SORRY_SIGN_URL ?? "",
  goodbyeSignUrl: process.env.EXPO_PUBLIC_GOODBYE_SIGN_URL ?? "",
  helpSignUrl: process.env.EXPO_PUBLIC_HELP_SIGN_URL ?? "",
} as const;
