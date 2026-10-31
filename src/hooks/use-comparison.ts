"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  createComparisonStore,
  EMPTY_COMPARISON,
  type ComparisonEnvironment,
} from "@/lib/comparison";

const browserEnvironment: ComparisonEnvironment = {
  read: (key) => window.localStorage.getItem(key),
  write: (key, value) => window.localStorage.setItem(key, value),
  getUrl: () => new URL(window.location.href),
  // Next.js integrates native history replacements with its router hooks.
  replaceUrl: (href) => window.history.replaceState(null, "", href),
};
const getServerSnapshot = () => EMPTY_COMPARISON;

export function useComparison(userId: string, properties: { id: string }[]) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const store = useMemo(
    () =>
      createComparisonStore(
        userId,
        properties.map((p) => p.id),
        browserEnvironment,
      ),
    [userId, properties],
  );
  const compared = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    store.syncLocation();
  }, [store, pathname, query]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === store.key || event.key === null) store.refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("popstate", store.syncLocation);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("popstate", store.syncLocation);
    };
  }, [store]);

  return [compared, store.setCompared] as const;
}
