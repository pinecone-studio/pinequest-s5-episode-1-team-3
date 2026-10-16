import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet } from "react-native";

import { WHITE } from "./alertStyles";

/**
 * Дэвсгэр дээр секундэд 1 удаа анивчих цагаан давхарга: утас руу харахгүй байсан ч анзаарна.
 * WCAG 2.3.1: секундэд 3-аас олон анивчвал таталт өдөөж болно. «Хөдөлгөөн багасгах» асаалттай бол анивчихгүй.
 */
export function AlertFlash() {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let active = true;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.delay(500),
    ]));
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => { if (active && !reduce) loop.start(); });
    return () => { active = false; loop.stop(); };
  }, [opacity]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: WHITE, opacity }]} />;
}
