import { test } from "node:test";
import assert from "node:assert/strict";
import {
  comparisonStorageKey,
  createComparisonStore,
  normalizeComparison,
} from "../src/lib/comparison";
import { portalReturnTo } from "../src/lib/return-to";

const availableIds = ["p01", "p02", "p03", "p04"];

function fixture(path = "/overview", userId = "investor-one") {
  let url = new URL(path, "https://portal.example");
  const storage = new Map<string, string>();
  const replacements: string[] = [];
  const environment = {
    read: (key: string) => storage.get(key) ?? null,
    write: (key: string, value: string) => {
      storage.set(key, value);
    },
    getUrl: () => new URL(url),
    replaceUrl: (href: string) => {
      replacements.push(href);
      url = new URL(href, url);
    },
  };
  const store = createComparisonStore(userId, availableIds, environment);
  return {
    store,
    storage,
    replacements,
    environment,
    url: () => new URL(url),
    visit: (path: string) => {
      url = new URL(path, url);
    },
  };
}

test("only available, unique property IDs are accepted, in order, up to three", () => {
  assert.deepEqual(
    normalizeComparison(
      [null, 1, {}, "missing", "p02", "p02", " p01 ", "p04", "p03"],
      new Set(availableIds),
    ),
    ["p02", "p01", "p04"],
  );
  assert.deepEqual(
    normalizeComparison({ id: "p01" }, new Set(availableIds)),
    [],
  );
});

test("selections survive a new store and stay isolated by account", () => {
  const f = fixture();
  f.store.setCompared(["p01", "p02"]);
  const restored = createComparisonStore(
    "investor-one",
    availableIds,
    f.environment,
  );
  const otherUser = createComparisonStore(
    "investor-two",
    availableIds,
    f.environment,
  );
  assert.deepEqual(restored.getSnapshot(), ["p01", "p02"]);
  assert.deepEqual(otherUser.getSnapshot(), []);
  assert.notEqual(
    comparisonStorageKey("investor-one"),
    comparisonStorageKey("investor-two"),
  );
  assert.equal(f.url().pathname + f.url().search, "/overview");
});

test("a shared comparison overrides local selection and canonicalizes invalid IDs", () => {
  const f = fixture(
    "/compare?ids=missing,p03,p03,p02,p01,p04&view=wide#metrics",
  );
  f.storage.set(f.store.key, JSON.stringify(["p04"]));
  assert.deepEqual(f.store.getSnapshot(), ["p03", "p02", "p01"]);
  f.store.syncLocation();
  assert.equal(f.url().searchParams.get("ids"), "p03,p02,p01");
  assert.equal(f.url().searchParams.get("view"), "wide");
  assert.equal(f.url().hash, "#metrics");
  assert.deepEqual(JSON.parse(f.storage.get(f.store.key)!), [
    "p03",
    "p02",
    "p01",
  ]);
  f.store.syncLocation();
  assert.equal(f.replacements.length, 1);
});

test("visiting bare /compare restores local selection and adds it to the URL", () => {
  const f = fixture("/compare");
  f.storage.set(f.store.key, JSON.stringify(["p02", "p04"]));
  f.store.syncLocation();
  assert.equal(f.url().searchParams.get("ids"), "p02,p04");
});

test("removing and clearing update URL and storage, including an explicit empty link", () => {
  const f = fixture("/compare?ids=p01,p02,p03");
  f.store.setCompared((ids) => ids.filter((id) => id !== "p02"));
  assert.equal(f.url().searchParams.get("ids"), "p01,p03");
  assert.deepEqual(JSON.parse(f.storage.get(f.store.key)!), ["p01", "p03"]);
  f.store.setCompared([]);
  assert.equal(f.url().searchParams.get("ids"), "");
  f.storage.set(f.store.key, JSON.stringify(["p04"]));
  assert.deepEqual(f.store.getSnapshot(), []);
  f.store.syncLocation();
  assert.equal(f.storage.get(f.store.key), "[]");
});

test("invalid shared links do not fall back to an unrelated saved basket", () => {
  const f = fixture("/compare?ids=missing");
  f.storage.set(f.store.key, JSON.stringify(["p01", "p02"]));
  assert.deepEqual(f.store.getSnapshot(), []);
  f.store.syncLocation();
  assert.equal(f.url().searchParams.get("ids"), "");
});

test("query changes and browser navigation use the current URL", () => {
  const f = fixture("/compare?ids=p01,p02");
  f.store.syncLocation();
  f.visit("/compare?ids=p03,p04");
  f.store.syncLocation();
  assert.deepEqual(f.store.getSnapshot(), ["p03", "p04"]);
  f.visit("/opportunities?region=Europe");
  assert.deepEqual(f.store.getSnapshot(), ["p03", "p04"]);
  f.store.setCompared(["p01"]);
  assert.equal(f.url().searchParams.get("region"), "Europe");
  assert.equal(f.url().searchParams.has("ids"), false);
});

test("malformed or obsolete storage is handled safely", () => {
  for (const stored of ["not json", "null", '{"id":"p01"}', '["missing"]']) {
    const f = fixture();
    f.storage.set(f.store.key, stored);
    assert.deepEqual(f.store.getSnapshot(), []);
  }
});

test("storage read/write failures preserve working in-memory selections", () => {
  const f = fixture();
  const store = createComparisonStore("investor-one", availableIds, {
    ...f.environment,
    read: () => {
      throw new Error("Storage blocked");
    },
    write: () => {
      throw new Error("Storage blocked");
    },
  });
  assert.deepEqual(store.getSnapshot(), []);
  store.setCompared(["p01", "p02"]);
  assert.deepEqual(store.getSnapshot(), ["p01", "p02"]);
  f.visit("/compare");
  store.syncLocation();
  assert.equal(f.url().searchParams.get("ids"), "p01,p02");
});

test("snapshots are stable and storage changes notify subscribers", () => {
  const f = fixture();
  assert.equal(f.store.getSnapshot(), f.store.getSnapshot());
  let notifications = 0;
  const unsubscribe = f.store.subscribe(() => notifications++);
  f.storage.set(f.store.key, '["p02"]');
  f.store.refresh();
  assert.equal(notifications, 1);
  assert.deepEqual(f.store.getSnapshot(), ["p02"]);
  assert.equal(f.store.getSnapshot(), f.store.getSnapshot());
  unsubscribe();
  f.store.setCompared([]);
  assert.equal(notifications, 1);
});

test("post-login redirects accept only local shareable portal URLs", () => {
  assert.equal(portalReturnTo("/compare?ids=p01,p02"), "/compare?ids=p01,p02");
  for (const destination of [
    undefined,
    ["/compare"],
    "https://evil.example/compare",
    "//evil.example/compare",
    "/\\evil.example/compare",
    "javascript:alert(1)",
    "/api/requests",
    "/login",
  ]) {
    assert.equal(portalReturnTo(destination), "/overview");
  }
});
