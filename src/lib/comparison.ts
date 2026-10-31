export const COMPARISON_LIMIT = 3;
export const EMPTY_COMPARISON: string[] = [];

export function comparisonStorageKey(userId: string) {
  return `knight-frank:comparison:v1:${userId}`;
}

export function normalizeComparison(value: unknown, availableIds: Set<string>) {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") continue;
    const id = candidate.trim();
    if (availableIds.has(id)) ids.add(id);
    if (ids.size === COMPARISON_LIMIT) break;
  }
  return [...ids];
}

export type ComparisonEnvironment = {
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  getUrl: () => URL;
  replaceUrl: (href: string) => void;
};

export type ComparisonUpdate = string[] | ((current: string[]) => string[]);

export function createComparisonStore(
  userId: string,
  propertyIds: string[],
  environment: ComparisonEnvironment,
) {
  const key = comparisonStorageKey(userId);
  const availableIds = new Set(propertyIds);
  const listeners = new Set<() => void>();
  let snapshot = EMPTY_COMPARISON;
  let memoryFallback: string[] | undefined;

  function getSnapshot() {
    const url = environment.getUrl();
    let selected: unknown;
    if (url.pathname === "/compare" && url.searchParams.has("ids")) {
      // Even an explicit empty selection overrides the browser's saved basket.
      selected = url.searchParams.getAll("ids").join(",").split(",");
    } else if (memoryFallback !== undefined) {
      selected = memoryFallback;
    } else {
      try {
        selected = JSON.parse(environment.read(key) ?? "[]");
      } catch {
        selected = snapshot;
      }
    }
    const ids = normalizeComparison(selected, availableIds);
    if (
      ids.length !== snapshot.length ||
      ids.some((id, index) => id !== snapshot[index])
    ) {
      snapshot = ids;
    }
    return snapshot;
  }

  function persist(ids: string[]) {
    try {
      environment.write(key, JSON.stringify(ids));
      memoryFallback = undefined;
    } catch {
      // Browsing and comparing still work when browser storage is unavailable.
      memoryFallback = ids;
    }
    const url = environment.getUrl();
    if (url.pathname === "/compare") {
      url.searchParams.set("ids", ids.join(","));
      const href = url.pathname + url.search + url.hash;
      const current = environment.getUrl();
      if (href !== current.pathname + current.search + current.hash) {
        environment.replaceUrl(href);
      }
    }
    listeners.forEach((listener) => listener());
  }

  return {
    key,
    getSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setCompared(update: ComparisonUpdate) {
      const current = getSnapshot();
      const next = typeof update === "function" ? update([...current]) : update;
      persist(normalizeComparison(next, availableIds));
    },
    syncLocation() {
      persist(getSnapshot());
    },
    refresh() {
      memoryFallback = undefined;
      listeners.forEach((listener) => listener());
    },
  };
}
