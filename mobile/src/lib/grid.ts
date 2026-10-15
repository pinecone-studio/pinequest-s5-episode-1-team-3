/**
 * Жагсаалтыг тэнцүү урттай мөрүүдэд хувааж, сүүлийн мөрийг null-оор дүүргэнэ.
 * flexWrap элемент бүрийг агуулгаар нь сунгадаг тул багана тэгш бус болдог: тогтмол мөр нь тэнцүү өргөн өгнө.
 */
export function gridRows<T>(items: readonly T[], columns: number): (T | null)[][] {
  if (columns < 1) return [];
  const rows: (T | null)[][] = [];
  for (let start = 0; start < items.length; start += columns) {
    const row: (T | null)[] = items.slice(start, start + columns);
    while (row.length < columns) row.push(null);
    rows.push(row);
  }
  return rows;
}
