import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyFilters,
  filterProperties,
  properties,
  assetClasses,
} from "../src/data";
import {
  createFilterStore,
  filtersHref,
  normalizeFilters,
  readFilters,
} from "../src/lib/filters";
import { portalReturnTo } from "../src/lib/return-to";

test("multi-select uses OR within filters and AND across filters", () => {
  const filters = {
    ...emptyFilters,
    region: ["Europe", "UK"],
    country: ["Germany", "United Kingdom"],
    asset: ["Offices", assetClasses[1]],
  };
  const results = filterProperties(filters);
  assert.ok(results.length >= 2);
  assert.ok(results.some((p) => p.region === "UK"));
  assert.ok(results.some((p) => p.region === "Europe"));
  assert.ok(
    results.every(
      (p) =>
        filters.country.includes(p.country) && filters.asset.includes(p.asset),
    ),
  );
  assert.equal(filterProperties(emptyFilters).length, properties.length);
});

test("URL round-trips every filter, including asset names containing commas and ampersands", () => {
  const filters = {
    ...emptyFilters,
    region: ["Europe", "UK"],
    country: ["Germany", "United Kingdom"],
    asset: [assetClasses[1], assetClasses[2]],
    query: "park & city",
    currency: "EUR",
    min: "20",
    max: "150",
    yield: "6.5",
    tenure: "Freehold",
  };
  const href = filtersHref("/opportunities", filters);
  const url = new URL(href, "https://portal.test");
  assert.deepEqual(url.searchParams.getAll("asset"), filters.asset);
  assert.deepEqual(readFilters(url.searchParams, properties), filters);
  assert.equal(filtersHref("/opportunities", emptyFilters), "/opportunities");
});

test("region changes retain compatible countries and discard incompatible ones", () => {
  const selected = {
    ...emptyFilters,
    country: ["Germany", "United Kingdom", "Netherlands"],
  };
  assert.deepEqual(
    normalizeFilters({ ...selected, region: ["Europe"] }, properties).country,
    ["Germany", "Netherlands"],
  );
  assert.deepEqual(
    normalizeFilters({ ...selected, region: [] }, properties).country,
    selected.country,
  );
});

test("malformed URL values and duplicate selections are ignored", () => {
  const filters = readFilters(
    new URLSearchParams(
      "region=Europe&region=Europe&region=invalid&country=United+Kingdom&asset=invalid&currency=EUR&min=-20&max=nope&yield=101&tenure=invalid",
    ),
    properties,
  );
  assert.deepEqual(filters, {
    ...emptyFilters,
    region: ["Europe"],
    currency: "EUR",
  });
  assert.equal(
    readFilters(new URLSearchParams("min=20&max=40"), properties).min,
    "",
  );
});

test("URL selections survive refresh and browser history restores controls and results", () => {
  let url = new URL("https://portal.test/opportunities?tracking=keep#results");
  const writes: { href: string; replace: boolean }[] = [];
  const env = {
    getUrl: () => url,
    writeUrl: (href: string, replace: boolean) => {
      writes.push({ href, replace });
      url = new URL(href, url);
    },
  };
  const store = createFilterStore(properties, env);
  store.setFilters((f) => ({ ...f, region: ["Europe", "UK"] }));
  const first = new URL(url);
  assert.equal(writes[0].replace, false);
  assert.equal(url.searchParams.get("tracking"), "keep");
  assert.equal(url.hash, "#results");
  store.setFilters((f) => ({ ...f, country: ["Germany"] }));
  assert.deepEqual(createFilterStore(properties, env).getSnapshot().country, [
    "Germany",
  ]);
  url = first;
  store.refresh();
  assert.deepEqual(store.getSnapshot().country, []);
  assert.deepEqual(store.getSnapshot().region, ["Europe", "UK"]);
  store.setFilters((f) => ({ ...f, query: "Rhine" }));
  assert.equal(writes.at(-1)?.replace, true);
  store.setFilters(emptyFilters);
  assert.equal(writes.at(-1)?.replace, false);
  assert.equal(url.searchParams.has("region"), false);
  assert.equal(url.searchParams.has("query"), false);
});

test("overview and assistant selections are carried into listing navigation without stale state", () => {
  let url = new URL("https://portal.test/overview");
  const store = createFilterStore(properties, {
    getUrl: () => url,
    writeUrl: (href) => {
      url = new URL(href, url);
    },
  });
  store.setFilters({ ...emptyFilters, region: ["Europe"], asset: ["Hotels"] });
  const href = store.listingHref("/opportunities");
  assert.equal(url.pathname, "/overview");
  url = new URL(href, url);
  assert.deepEqual(store.getSnapshot().region, ["Europe"]);
  assert.deepEqual(store.getSnapshot().asset, ["Hotels"]);
  url = new URL("/property/p02", url);
  assert.equal(store.listingHref("/opportunities"), href);
  url = new URL("/opportunities", url);
  assert.deepEqual(store.getSnapshot(), emptyFilters);
});

test("filtered listing links survive sign-in while external redirects are rejected", () => {
  for (const path of ["/opportunities", "/shortlist"]) {
    const href = `${path}?region=Europe&region=UK&asset=Offices`;
    assert.equal(portalReturnTo(href), href);
  }
  assert.equal(
    portalReturnTo("https://evil.test/opportunities?region=Europe"),
    "/overview",
  );
});
