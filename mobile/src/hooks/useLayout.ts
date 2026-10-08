import { useWindowDimensions } from "react-native";

import { getLayout, type Layout } from "@/lib/responsive";

export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  return getLayout(width);
}