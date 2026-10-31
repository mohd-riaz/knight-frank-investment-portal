import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyFilters,
  examplePrompts,
  filterProperties,
  interpret,
  properties,
} from "../src/data";

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
      region: "Europe",
      country: "Germany",
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
