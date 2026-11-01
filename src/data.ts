import tracker from "./datasets/october-2024.json";
import { presentProperty } from "./lib/property-presentation";
import { regionalLocations } from "./lib/regional-locations";

export const regions = [
  "Asia",
  "Australia",
  "Europe",
  "UK",
  "USA",
  "Africa",
  "Middle East",
  "Rest of the World",
];
export const assetClasses = [
  "All Assets",
  "Industrial, Logistics & Data Centres",
  "Retail — Units, Malls & Retail Parks",
  "Offices",
  "Hotels",
  "Mixed Use",
  "Other / Miscellaneous",
  "Residential",
];
export type Property = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  asset: string;
  currency: string;
  price: number | null;
  yield: number | null;
  area: number | null;
  priceQualifier?: string;
  annualIncome?: number | null;
  incomeType?: string;
  tenure: string;
  image: string;
  label: string;
  summary: string;
  highlights: string[];
  confidential?: boolean;
};
// Both the portal and database seed consume this reviewed, historical catalog.
export const sourceProperties: Property[] = tracker.map((entry) => {
  const { sourcePanels, ...property } = entry;
  // Source panel references are retained in the reviewed JSON.
  void sourcePanels;
  return property;
});
export const properties: Property[] = [
  ...sourceProperties,
  ...regions
    .filter((region) => !sourceProperties.some((p) => p.region === region))
    .flatMap((region) =>
      sourceProperties.map((property, index) => ({
        ...property,
        id: `${property.id}-demo-${region.toLowerCase().replaceAll(" ", "-")}`,
        region,
        ...regionalLocations[region][index % regionalLocations[region].length],
      })),
    ),
].map(presentProperty);
export const shortAsset = (a: string) =>
  a === assetClasses[1]
    ? "Industrial & logistics"
    : a === assetClasses[2]
      ? "Retail"
      : a === assetClasses[6]
        ? "Specialist assets"
        : a;
export const money = (p: Property) =>
  p.price === null
    ? "On application"
    : `${p.currency} ${p.price.toLocaleString("en-GB")}m`;
export const income = (p: Property) =>
  p.annualIncome == null
    ? "Not stated"
    : `${p.currency} ${p.annualIncome.toLocaleString("en-GB")}`;
export const yieldText = (p: Property) =>
  p.yield === null
    ? "Not stated"
    : `${p.yield.toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;
export const areaText = (p: Property) =>
  p.area === null ? "Not stated" : `${p.area.toLocaleString("en-GB")} m²`;
export const pricePerArea = (p: Property) =>
  p.price === null || !p.area
    ? "Not stated"
    : `${p.currency} ${Math.round((p.price * 1e6) / p.area).toLocaleString("en-GB")}`;
export const highestYieldFirst = (a: Property, b: Property) =>
  (b.yield ?? -1) - (a.yield ?? -1);
export type Filters = {
  region: string[];
  country: string[];
  asset: string[];
  query: string;
  min: string;
  max: string;
  currency: string;
  yield: string;
  tenure: string;
};
export const emptyFilters: Filters = {
  region: [],
  country: [],
  asset: [],
  query: "",
  min: "",
  max: "",
  currency: "All currencies",
  yield: "",
  tenure: "Any tenure",
};
export function filterProperties(f: Filters, source = properties) {
  return source.filter(
    (p) =>
      (!f.region.length || f.region.includes(p.region)) &&
      (!f.country.length || f.country.includes(p.country)) &&
      (!f.asset.length || f.asset.includes(p.asset)) &&
      (!f.query ||
        `${p.name} ${p.city} ${p.country} ${p.asset}`
          .toLowerCase()
          .includes(f.query.toLowerCase())) &&
      (f.currency === "All currencies" || p.currency === f.currency) &&
      (!f.min || (p.price !== null && p.price >= Number(f.min))) &&
      (!f.max || (p.price !== null && p.price <= Number(f.max))) &&
      (!f.yield || (p.yield !== null && p.yield >= Number(f.yield))) &&
      (f.tenure === "Any tenure" || p.tenure === f.tenure),
  );
}
export const examplePrompts = [
  "Show me all logistics assets in the UK yielding above 6.5%.",
  "What hotels are available in the Middle East below GBP 20 million?",
  "Compare the three highest-yielding office assets in the UK.",
  "Show me retail investments in the UK between GBP 1m and GBP 20m, above 7%, excluding leasehold.",
];
export function interpret(text: string, source: Property[] = properties) {
  const q = text.toLowerCase();
  const filters = { ...emptyFilters };
  const criteria: string[] = [];
  const region = regions.find((r) =>
    r === "UK" ? /\buk\b|united kingdom/.test(q) : q.includes(r.toLowerCase()),
  );
  if (region) {
    filters.region = [region];
    criteria.push(region);
  }
  if (/logistics|industrial|data cent/.test(q))
    filters.asset = [assetClasses[1]];
  else if (/hotel/.test(q)) filters.asset = ["Hotels"];
  else if (/office/.test(q)) filters.asset = ["Offices"];
  else if (/retail|mall/.test(q)) filters.asset = [assetClasses[2]];
  else if (/mixed.use/.test(q)) filters.asset = ["Mixed Use"];
  else if (/residential|apartment/.test(q)) filters.asset = ["Residential"];
  criteria.push(...filters.asset.map(shortAsset));
  const y = q.match(
    /(?:above|over|minimum|at least|yielding)\s*(\d+(?:\.\d+)?)\s*%/,
  );
  if (y) {
    filters.yield = y[1];
    criteria.push(`Yield ≥ ${y[1]}%`);
  }
  const currency = q.includes("€")
    ? "EUR"
    : q.includes("£")
      ? "GBP"
      : ["aed", "eur", "gbp", "usd", "aud", "sgd", "cad", "zar"]
          .find((c) => q.includes(c))
          ?.toUpperCase();
  if (currency) filters.currency = currency;
  const range = q.match(
    /between\s*(?:€|£|\$|aed|eur|gbp|usd)?\s*(\d+(?:\.\d+)?)\s*(?:m|million)?\s*and\s*(?:€|£|\$|aed|eur|gbp|usd)?\s*(\d+(?:\.\d+)?)/,
  );
  const max = q.match(
    /(?:below|under|less than)\s*(?:€|£|\$|aed|eur|gbp|usd)?\s*(\d+(?:\.\d+)?)/,
  );
  if (range) {
    filters.min = range[1];
    filters.max = range[2];
  } else if (max) filters.max = max[1];
  if ((range || max) && !currency)
    return {
      error:
        "Please include a currency with the price, such as EUR 50m or AED 500 million.",
    };
  if (filters.min || filters.max)
    criteria.push(`${currency} ${filters.min || "0"}–${filters.max || "any"}m`);
  if (/excluding leasehold|freehold/.test(q)) {
    filters.tenure = "Freehold";
    criteria.push("Freehold");
  } else if (/leasehold/.test(q)) {
    filters.tenure = "Leasehold";
    criteria.push("Leasehold");
  }
  if (!criteria.length)
    return {
      error:
        "I can filter the opportunities by region, asset class, price, yield and tenure. Try one of the example searches below.",
    };
  let results = filterProperties(filters, source);
  const compare = /compare/.test(q);
  if (/highest|compare/.test(q))
    results = [...results].sort(highestYieldFirst).slice(0, 3);
  return { filters, criteria, results, compare };
}
