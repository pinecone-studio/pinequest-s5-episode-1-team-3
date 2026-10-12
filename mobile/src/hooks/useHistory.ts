import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { HistoryEntry } from "@/lib/history";
import { clearHistory, listHistory } from "@/services/storage/history";

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    listHistory()
      .then((rows) => {
        setEntries(rows);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);
  // Мэдэгдлээс буцаж ирэх бүрт шинэ мөр харагдана.
  useFocusEffect(load);

  const clear = useCallback(() => {
    clearHistory().then(load, () => setError(true));
  }, [load]);

  return { entries, error, clear };
}
