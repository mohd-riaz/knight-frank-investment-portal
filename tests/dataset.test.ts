import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import images from "../src/datasets/october-2024-images.json";
import { propertyImage } from "../src/lib/property-images";
import raw from "../data/october-2024-source.json";
import reviewed from "../src/datasets/october-2024.json";
import { presentProperty } from "../src/lib/property-presentation";
import { regionalLocations } from "../src/lib/regional-locations";
import {
  areaText,
  assetClasses,
  emptyFilters,
  examplePrompts,
  filterProperties,
  highestYieldFirst,
  income,
  interpret,
  money,
  pricePerArea,
  properties,
  regions,
  sourceProperties,
  yieldText,
} from "../src/data";

const source = (name: string) => {
  const property = sourceProperties.find((p) => p.name === name);
  assert.ok(property, `Missing source property: ${name}`);
  return property;
};

test("every opportunity uses its corresponding original PDF photo, including regional copies", () => {
  assert.equal(images.sourceSha256, raw.sha256);
  assert.equal(images.images.length, 58);
  const manifest = new Map(images.images.map((image) => [image.image, image]));
  for (const property of reviewed) {
    const photo = manifest.get(property.image);
    assert.ok(photo, property.name);
    assert.equal(photo.page, property.sourcePanels[0].page);
    assert.equal(photo.column, property.sourcePanels[0].column);
  }
  for (const property of properties) assert.ok(manifest.has(property.image));
  for (const photo of images.images) {
    const props = propertyImage(photo);
    assert.equal(props.width, photo.width);
    assert.equal(props.height, photo.height);
    const bytes = readFileSync(
      new URL(`../public${props.src}`, import.meta.url),
    );
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      photo.sha256,
    );
    assert.ok(photo.width > 250 && photo.height > 190);
  }
  assert.equal(source("Jellicoe House").image, source("Vanbrugh House").image);
});

test("every PDF listing panel is represented, including the duplicate and paired buildings", () => {
  assert.equal(raw.entries.length, 59);
  assert.equal(sourceProperties.length, 59);
  const panels = (entries: { page: number; column: number }[]) =>
    new Set(entries.map((e) => `${e.page}:${e.column}`));
  assert.deepEqual(
    panels(reviewed.flatMap((p) => p.sourcePanels)),
    panels(raw.entries),
  );
  assert.equal(
    sourceProperties.filter((p) => p.name === "18 Glebe Road").length,
    1,
  );
  assert.equal(source("Jellicoe House").price, 5);
  assert.equal(source("Jellicoe House").annualIncome, 632664);
  assert.equal(source("Vanbrugh House").price, 4);
  assert.equal(source("Vanbrugh House").annualIncome, 477930);
});

test("source values preserve units, reported income and precise yields", () => {
  const office = source("88 Jermyn Street");
  assert.equal(office.price, 7.5);
  assert.equal(office.area, 353);
  assert.equal(yieldText(office), "3.29%");
  assert.equal(income(office), "GBP 263,560");
  assert.equal(source("Durr HQ, Broxell Close").price, 2.825);
  assert.equal(source("Durr HQ, Broxell Close").yield, 14);
  assert.equal(source("Two Devon Way").price, 3.75);
  assert.equal(source("Festival Place").annualIncome, 11665221);
  assert.equal(source("Festival Place").incomeType, "Net operating income");
  assert.equal(source("Strathmore Court, Regent Park").annualIncome, null);
  assert.equal(source("Hadrian's Tower").area, null);
  assert.equal(source("Premier Inn West Thurrock").area, null);
  assert.equal(source("The Ariel, Television Centre").asset, "Residential");
});

test("unknown or ambiguous metrics remain unknown and never satisfy numeric filters", () => {
  for (const name of [
    "Sovereign House",
    "Meadowside House",
    "Atrium Court, Waterloo Street",
  ]) {
    const property = source(name);
    assert.equal(property.price, null);
    assert.deepEqual(
      filterProperties({ ...emptyFilters, max: "1000" }, [property]),
      [],
    );
    assert.equal(pricePerArea(property), "Not stated");
  }
  const unknown = source("Sovereign House");
  assert.equal(money(unknown), "On application");
  assert.equal(yieldText(unknown), "Not stated");
  assert.equal(income(unknown), "Not stated");
  assert.deepEqual(
    filterProperties({ ...emptyFilters, yield: "0" }, [unknown]),
    [],
  );
  assert.equal(
    areaText(source("Hamilton Terrace, St John's Wood")),
    "Not stated",
  );
  assert.equal(source("Beach House Estate, Beach Lane").area, null);
  assert.deepEqual(
    [unknown, source("EQ")].sort(highestYieldFirst).map((p) => p.name),
    ["EQ", "Sovereign House"],
  );
  assert.equal(highestYieldFirst(unknown, unknown), 0);
});

test("prices display clean amounts while source qualifications and sold status are retained", () => {
  assert.equal(money(source("Deiniol Shopping Centre")), "GBP 1.155m");
  assert.equal(
    sourceProperties.filter((p) => p.label === "Sold at auction").length,
    2,
  );
  assert.equal(source("4 Union Road, Stockwell").priceQualifier, "Guide from");
  assert.equal(money(source("4 Union Road, Stockwell")), "GBP 0.46m");
  assert.equal(money(source("Theobalds Park Estate")), "GBP 12.5m");
  assert.equal(money(source("Allen House, Kensington")), "GBP 1.29m");
});

test("regional records use consistent locations while retaining metrics and stable IDs", () => {
  assert.equal(properties.length, 472);
  assert.equal(new Set(properties.map((p) => p.id)).size, properties.length);
  for (const region of regions) {
    const records = properties.filter((p) => p.region === region);
    assert.equal(records.length, 59, region);
    for (const [index, property] of records.entries()) {
      assert.ok(property.id.length <= 64, property.id);
      assert.ok(assetClasses.includes(property.asset));
      const original = sourceProperties[index];
      if (region === "UK") {
        assert.equal(property.city, original.city);
        assert.equal(property.country, "United Kingdom");
        continue;
      }
      assert.ok(
        regionalLocations[region].some(
          (location) =>
            location.city === property.city &&
            location.country === property.country,
        ),
        `${region}: ${property.city}, ${property.country}`,
      );
      assert.notEqual(property.country, "United Kingdom");
      for (const key of [
        "price",
        "yield",
        "area",
        "annualIncome",
        "currency",
        "tenure",
      ] as const) {
        assert.equal(property[key], original[key], `${region}: ${key}`);
      }
      assert.equal(property.name, original.name);
      assert.equal(property.summary, original.summary);
      assert.doesNotMatch(property.label, /demo|October 2024/i);
      assert.doesNotMatch(
        property.highlights.join(" "),
        /Regional demo|Source:|mapped to Other/i,
      );
      assert.doesNotMatch(money(property), /guide|from|demo/i);
    }
  }
});

test("listing presentation removes import badges and retains meaningful sold badges", () => {
  const regular = properties.find(
    (p) => p.id === source("7 Old Park Lane").id,
  )!;
  assert.equal(regular.label, "");
  assert.ok(regular.highlights.length);
  assert.ok(regular.highlights.every((line) => !line.startsWith("Source:")));
  const sold = properties.find(
    (p) => p.id === source("Deiniol Shopping Centre").id,
  )!;
  assert.equal(sold.label, "Sold at auction");
  const residential = properties.find(
    (p) => p.id === source("Allen House, Kensington").id,
  )!;
  assert.equal(residential.priceQualifier, "");
  assert.equal(source("Allen House, Kensington").priceQualifier, "From");
});

test("existing database copies receive the same cleanup without changing saved property IDs", () => {
  const original = source("Allen House, Kensington");
  const legacy = {
    ...original,
    id: `${original.id}-demo-asia`,
    name: `${original.name} — Asia demo`,
    label: "Regional demo",
    summary: `Regional demo for Asia, reusing the UK dataset. Original location: London, United Kingdom. GBP values and original property details are unchanged. ${original.summary}`,
    highlights: [
      "Regional demo only: this is a copy, not a verified listing in Asia.",
      ...original.highlights,
    ],
  };
  const clean = presentProperty(legacy);
  assert.equal(clean.id, legacy.id);
  assert.equal(clean.name, original.name);
  assert.equal(clean.summary, original.summary);
  assert.equal(clean.price, original.price);
  assert.equal(clean.label, "");
  assert.equal(clean.priceQualifier, "");
  assert.ok(clean.highlights.every((line) => !/demo|Source:/i.test(line)));
  assert.deepEqual(presentProperty(clean), clean);
});

test("all assistant examples return imported records, including regional demos and residential search", () => {
  for (const prompt of examplePrompts) {
    const result = interpret(prompt);
    assert.equal(result.error, undefined);
    assert.ok(result.results?.length, prompt);
    assert.ok(result.results.every((p) => p.id.startsWith("oct24-")));
  }
  assert.deepEqual(
    interpret(examplePrompts[2]).results?.map((p) => p.name),
    ["Durr HQ, Broxell Close", "Jellicoe House", "Vanbrugh House"],
  );
  const residential = interpret("Residential in the UK below GBP 1 million");
  assert.equal(residential.results?.length, 3);
  assert.ok(residential.results?.every((p) => p.asset === "Residential"));
});
