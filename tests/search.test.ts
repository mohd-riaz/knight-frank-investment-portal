import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyFilters,
  filterProperties as filterCatalog,
  interpret as interpretCatalog,
} from "../src/data";

import { properties } from "./fixtures/properties";
const interpret = (query: string, source = properties) =>
  interpretCatalog(query, source);
const filterProperties = (filters: Parameters<typeof filterCatalog>[0]) =>
  filterCatalog(filters, properties);
const examplePrompts = [
  "Show me all logistics assets in Europe yielding above 6.5%.",
  "What hotels are available in the Middle East below AED 500 million?",
  "Compare the three highest-yielding office assets in the UK.",
  "Show me income-producing logistics investments in Europe between �50m and �150m, above 6%, excluding leasehold.",
];

test("all four design prompts return the expected property sets", () => {
  const expected = [
    ["p02", "p06", "p14"],
    ["p03", "p13"],
    ["p04", "p05", "p01"],
    ["p02", "p06", "p14"],
  ];
  examplePrompts.forEach((prompt, index) =>
    assert.deepEqual(
      interpret(prompt).results?.map((p) => p.id),
      expected[index],
    ),
  );
});
test("price search requires an explicit currency", () => {
  assert.ok(interpret("Hotels in the Middle East below 500 million").error);
  assert.deepEqual(
    filterProperties({ ...emptyFilters, currency: "GBP", max: "50" }).map(
      (p) => p.id,
    ),
    ["p04", "p05"],
  );
});
test("assistant queries the supplied database records, not a separate static catalog", () => {
  assert.equal(interpret(examplePrompts[0], []).results?.length, 0);
  assert.equal(
    interpret(examplePrompts[0], [properties[1]]).results?.length,
    1,
  );
});
test("combined filters support country, text, tenure and no results", () => {
  assert.deepEqual(
    filterProperties({
      ...emptyFilters,
      region: ["Europe"],
      country: ["Germany"],
      query: "Rhine",
      tenure: "Freehold",
    }).map((p) => p.id),
    ["p14"],
  );
  assert.equal(
    filterProperties({ ...emptyFilters, currency: "GBP", min: "60", max: "20" })
      .length,
    0,
  );
});
