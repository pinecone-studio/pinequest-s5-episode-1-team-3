import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { gridRows } from "@/lib/grid";
import { spacing } from "./theme";

type Props<T> = { items: readonly T[]; columns: number; render: (item: T) => ReactNode; keyOf: (item: T) => string };

/** Тэнцүү өргөнтэй багана. Мөр доторх элементүүд хамгийн өндрийнхөө хэмжээгээр тэгшрэнэ. */
export function Grid<T>({ items, columns, render, keyOf }: Props<T>) {
  return (
    <View style={styles.grid}>
      {gridRows(items, columns).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item, column) => (
            <View key={item === null ? `empty-${column}` : keyOf(item)} style={styles.cell}>{item !== null && render(item)}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  cell: { flex: 1 },
});
