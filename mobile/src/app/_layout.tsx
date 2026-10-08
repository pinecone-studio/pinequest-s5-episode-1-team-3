import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      {/* Screens draw their own header, so the native one is off. */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="alert"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}