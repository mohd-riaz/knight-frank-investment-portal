import { test } from "node:test";
import assert from "node:assert/strict";
import { properties } from "../src/data";
import { propertyInput } from "../src/lib/admin-validation";
import {
  adminCurrencies,
  adminTenures,
} from "../src/lib/admin-property-options";
const property = {
  ...properties[0],
  publication: "published",
  annualIncome: null,
};
test("every editor currency and tenure is accepted and preserved", () => {
  for (const currency of adminCurrencies)
    for (const tenure of adminTenures) {
      const parsed = propertyInput.parse({ ...property, currency, tenure });
      assert.equal(parsed.currency, currency);
      assert.equal(parsed.tenure, tenure);
    }
});
test("historical catalog records round-trip without guessing missing tenure", () => {
  for (const item of properties) {
    const parsed = propertyInput.parse({
      ...item,
      publication: "published",
      annualIncome: item.annualIncome ?? null,
    });
    assert.equal(parsed.tenure, item.tenure);
    assert.equal(parsed.currency, item.currency);
  }
});
test("unsupported currencies, tenures and invalid metrics remain rejected", () => {
  for (const change of [
    { currency: "INVALID" },
    { tenure: "Unknown ownership" },
    { yield: 101 },
    { price: -1 },
    { area: 1.5 },
  ]) {
    assert.equal(
      propertyInput.safeParse({ ...property, ...change }).success,
      false,
    );
  }
});
