import { requireOptionalNativeModule } from "expo";
import { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";

// 10/12-ны Android APK-д камерын native модуль байхгүй: тэнд гэрэл анивчихгүй, апп унахгүй.
// Вэбэд вэбкам асаахгүй. iPhone-ы Expo Go-д бий.
const camera: typeof import("expo-camera") | null =
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native модуль байгаа үед л ачаална
  Platform.OS !== "web" && requireOptionalNativeModule("ExpoCamera") ? require("expo-camera") : null;

// Дэлгэцийн анивчилттай ижил: секундэд 1 удаа (WCAG 2.3.1: ≤3).
const TOGGLE_MS = 500;

function Torch({ cameraModule }: { cameraModule: typeof import("expo-camera") }) {
  const [permission, requestPermission] = cameraModule.useCameraPermissions();
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);
  useEffect(() => {
    const timer = setInterval(() => setOn((value) => !value), TOGGLE_MS);
    return () => clearInterval(timer);
  }, []);
  if (!permission?.granted) return null;
  // Гар чийдэн камер нээлттэй үед л асдаг: харагдахгүй 1px камер.
  return <cameraModule.CameraView style={styles.hidden} facing="back" enableTorch={on} />;
}

/** Мэдэгдэл ирэхэд арын гар чийдэнг анивчуулна. Хэрэглэгч «Ойлголоо» дарах хүртэл. */
export function AlertTorch() {
  return camera ? <Torch cameraModule={camera} /> : null;
}

const styles = StyleSheet.create({
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
