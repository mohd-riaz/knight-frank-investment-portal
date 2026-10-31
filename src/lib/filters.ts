import {
  assetClasses,
  emptyFilters,
  regions,
  type Filters,
  type Property,
} from "../data";

export const filterKeys = Object.keys(emptyFilters) as (keyof Filters)[];
export const isListingPath = (path: string) =>
  path === "/opportunities" || path === "/shortlist";

export function normalizeFilters(
  filters: Filters,
  properties: Property[],
): Filters {
  const selected = (values: string[], allowed: string[]) => [
    ...new Set(values.filter((value) => allowed.includes(value))),
  ];
  const region = selected(filters.region, regions);
  const countries = properties
    .filter((p) => !region.length || region.includes(p.region))
    .map((p) => p.country);
  const currency = properties.some((p) => p.currency === filters.currency)
    ? filters.currency
    : emptyFilters.currency;
  const number = (value: string, max = Infinity) =>
    /^\d+(?:\.\d*)?$/.test(value) && Number(value) <= max ? value : "";
  return {
    region,
    country: selected(filters.country, countries),
    asset: selected(filters.asset, assetClasses.slice(1)),
    query: filters.query,
    currency,
    min: currency === emptyFilters.currency ? "" : number(filters.min),
    max: currency === emptyFilters.currency ? "" : number(filters.max),
    yield: number(filters.yield, 100),
    tenure: ["Freehold", "Leasehold"].includes(filters.tenure)
      ? filters.tenure
      : emptyFilters.tenure,
  };
}

export function readFilters(
  params: URLSearchParams,
  properties: Property[],
): Filters {
  return normalizeFilters(
    {
      region: params.getAll("region"),
      country: params.getAll("country"),
      asset: params.getAll("asset"),
      query: params.get("query") ?? "",
      currency: params.get("currency") ?? emptyFilters.currency,
      min: params.get("min") ?? "",
      max: params.get("max") ?? "",
      yield: params.get("yield") ?? "",
      tenure: params.get("tenure") ?? emptyFilters.tenure,
    },
    properties,
  );
}

export function filtersHref(
  path: string,
  filters: Filters,
  params = new URLSearchParams(),
) {
  const next = new URLSearchParams(params);
  for (const key of filterKeys) {
    next.delete(key);
    const value = filters[key];
    if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
    else if (value && value !== emptyFilters[key]) next.set(key, value);
  }
  const query = next.toString();
  return path + (query ? `?${query}` : "");
}

export type FilterUpdate = Filters | ((current: Filters) => Filters);
export type FilterEnvironment = {
  getUrl: () => URL;
  writeUrl: (href: string, replace: boolean) => void;
};

export function createFilterStore(
  properties: Property[],
  environment: FilterEnvironment,
) {
  let snapshot = emptyFilters;
  const listeners = new Set<() => void>();
  function cache(next: Filters) {
    if (JSON.stringify(next) !== JSON.stringify(snapshot)) snapshot = next;
    return snapshot;
  }
  function getSnapshot() {
    const url = environment.getUrl();
    return isListingPath(url.pathname)
      ? cache(readFilters(url.searchParams, properties))
      : snapshot;
  }
  function refresh() {
    getSnapshot();
    listeners.forEach((listener) => listener());
  }
  return {
    getSnapshot,
    refresh,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setFilters(update: FilterUpdate) {
      const current = getSnapshot();
      const next = normalizeFilters(
        typeof update === "function" ? update(current) : update,
        properties,
      );
      const url = environment.getUrl();
      cache(next);
      if (isListingPath(url.pathname)) {
        const href =
          filtersHref(url.pathname, next, url.searchParams) + url.hash;
        if (href !== url.pathname + url.search + url.hash) {
          // Typing replaces the current entry; discrete selections support Back.
          const changed = filterKeys.filter(
            (key) => JSON.stringify(current[key]) !== JSON.stringify(next[key]),
          );
          const replace =
            changed.length > 0 &&
            changed.every((key) =>
              ["query", "min", "max", "yield"].includes(key),
            );
          environment.writeUrl(href, replace);
        }
      }
      listeners.forEach((listener) => listener());
    },
    listingHref(path: string) {
      return filtersHref(path, getSnapshot());
    },
  };
}
