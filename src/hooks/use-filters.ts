"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { emptyFilters, type Property } from "@/data";
import { createFilterStore } from "@/lib/filters";

const getServerSnapshot = () => emptyFilters;

export function useFilters(properties: Property[]) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const store = useMemo(
    () =>
      createFilterStore(properties, {
        getUrl: () => new URL(window.location.href),
        writeUrl: (href, replace) => {
          if (replace) window.history.replaceState(null, "", href);
          else window.history.pushState(null, "", href);
        },
      }),
    [properties],
  );
  const filters = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  useEffect(() => {
    store.refresh();
  }, [store, pathname, query]);
  useEffect(() => {
    window.addEventListener("popstate", store.refresh);
    return () => window.removeEventListener("popstate", store.refresh);
  }, [store]);
  return [filters, store.setFilters, store.listingHref] as const;
}
