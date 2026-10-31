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
];
export type Property = {
  id: string;
  name: string;
  city: string;
  country: string;
  region: string;
  asset: string;
  currency: string;
  price: number;
  yield: number;
  area: number;
  tenure: string;
  image: string;
  label: string;
  summary: string;
  highlights: string[];
  confidential?: boolean;
};
const base = {
  tenure: "Freehold",
  highlights: [
    "Established location with access to regional transport links",
    "Income-producing asset with an active management opportunity",
    "Further information available through your Knight Frank advisor",
  ],
};
export const properties: Property[] = [
  {
    ...base,
    id: "p01",
    name: "Riverside Exchange",
    city: "London",
    country: "United Kingdom",
    region: "UK",
    asset: "Offices",
    currency: "GBP",
    price: 82,
    yield: 6.8,
    area: 18400,
    image: "office",
    label: "Core plus",
    summary:
      "A multi-let office investment in an established London business district. The investment case combines contracted income with a phased refurbishment opportunity.",
  },
  {
    ...base,
    id: "p02",
    name: "Gateway Logistics Park",
    city: "Rotterdam",
    country: "Netherlands",
    region: "Europe",
    asset: assetClasses[1],
    currency: "EUR",
    price: 96,
    yield: 7.2,
    area: 62400,
    image: "tower",
    label: "Income producing",
    summary:
      "A logistics investment positioned for regional distribution. The underwriting assumes diversified occupational demand and modern operational accommodation.",
  },
  {
    ...base,
    id: "p03",
    name: "Marina Hotel Collection",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East",
    asset: "Hotels",
    currency: "AED",
    price: 385,
    yield: 6.4,
    area: 32600,
    image: "hotel",
    label: "Value add",
    confidential: true,
    summary:
      "A hospitality opportunity with a waterfront setting. The investment case combines operating income and a selective improvement programme.",
  },
  {
    ...base,
    id: "p04",
    name: "Central Square",
    city: "Manchester",
    country: "United Kingdom",
    region: "UK",
    asset: "Offices",
    currency: "GBP",
    price: 48,
    yield: 7.4,
    area: 16100,
    image: "tower",
    label: "Core plus",
    summary:
      "A regional office investment with a diversified occupier base and an accessible city-centre location.",
  },
  {
    ...base,
    id: "p05",
    name: "West End House",
    city: "Birmingham",
    country: "United Kingdom",
    region: "UK",
    asset: "Offices",
    currency: "GBP",
    price: 31,
    yield: 7.1,
    area: 11200,
    image: "office",
    label: "Income producing",
    summary:
      "A income-producing office asset with scope to improve common areas and renew leases over time.",
  },
  {
    ...base,
    id: "p06",
    name: "Continental Distribution",
    city: "Hamburg",
    country: "Germany",
    region: "Europe",
    asset: assetClasses[1],
    currency: "EUR",
    price: 124,
    yield: 6.9,
    area: 78900,
    image: "tower",
    label: "Core",
    summary:
      "A distribution campus serving continental trade routes, with income from multiple occupiers.",
  },
  {
    ...base,
    id: "p07",
    name: "Eastport Industrial",
    city: "Lyon",
    country: "France",
    region: "Europe",
    asset: assetClasses[1],
    currency: "EUR",
    price: 68,
    yield: 6.3,
    area: 44600,
    image: "office",
    label: "Core plus",
    tenure: "Leasehold",
    summary:
      "A industrial estate with diversified accommodation and potential for selective asset management.",
  },
  {
    ...base,
    id: "p08",
    name: "Orchard Commercial",
    city: "Singapore",
    country: "Singapore",
    region: "Asia",
    asset: assetClasses[2],
    currency: "SGD",
    price: 165,
    yield: 4.8,
    area: 14600,
    image: "commercial",
    label: "Core",
    tenure: "Leasehold",
    summary:
      "A retail investment in an established urban catchment, combining consumer and service-led occupiers.",
  },
  {
    ...base,
    id: "p09",
    name: "Harbour Quarter",
    city: "Sydney",
    country: "Australia",
    region: "Australia",
    asset: "Mixed Use",
    currency: "AUD",
    price: 112,
    yield: 5.8,
    area: 28100,
    image: "city",
    label: "Core plus",
    summary:
      "A mixed-use investment combining workplace and retail accommodation near major transport connections.",
  },
  {
    ...base,
    id: "p10",
    name: "Hudson Business Centre",
    city: "New York",
    country: "United States",
    region: "USA",
    asset: "Offices",
    currency: "USD",
    price: 140,
    yield: 6.1,
    area: 24100,
    image: "office",
    label: "Value add",
    summary:
      "An office opportunity with a repositioning strategy and diversified leasing assumptions.",
  },
  {
    ...base,
    id: "p11",
    name: "Cape Learning Campus",
    city: "Cape Town",
    country: "South Africa",
    region: "Africa",
    asset: assetClasses[6],
    currency: "ZAR",
    price: 245,
    yield: 8.1,
    area: 19800,
    image: "tower",
    label: "Long income",
    summary:
      "A specialist education asset with campus accommodation and a long-income investment profile.",
  },
  {
    ...base,
    id: "p12",
    name: "Pacific Retail Centre",
    city: "Vancouver",
    country: "Canada",
    region: "Rest of the World",
    asset: assetClasses[2],
    currency: "CAD",
    price: 74,
    yield: 5.9,
    area: 21300,
    image: "commercial",
    label: "Core",
    summary:
      "A retail centre serving a metropolitan catchment with a blend of everyday services and retail accommodation.",
  },
  {
    ...base,
    id: "p13",
    name: "Gulf Hospitality House",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    region: "Middle East",
    asset: "Hotels",
    currency: "AED",
    price: 460,
    yield: 6.7,
    area: 38500,
    image: "hotel",
    label: "Core plus",
    summary:
      "A hotel investment with established operating facilities and a selective capital expenditure strategy.",
  },
  {
    ...base,
    id: "p14",
    name: "Rhine Logistics Hub",
    city: "Düsseldorf",
    country: "Germany",
    region: "Europe",
    asset: assetClasses[1],
    currency: "EUR",
    price: 79,
    yield: 6.6,
    area: 51900,
    image: "office",
    label: "Income producing",
    summary:
      "A freehold logistics asset serving a broad industrial catchment, with contracted rental income.",
  },
];
export const shortAsset = (a: string) =>
  a === assetClasses[1]
    ? "Industrial & logistics"
    : a === assetClasses[2]
      ? "Retail"
      : a === assetClasses[6]
        ? "Specialist assets"
        : a;
export const money = (p: Property) =>
  `${p.currency} ${p.price.toLocaleString("en-GB")}m`;
export const income = (p: Property) =>
  `${p.currency} ${((p.price * p.yield) / 100).toFixed(2)}m`;
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
      (!f.min || p.price >= Number(f.min)) &&
      (!f.max || p.price <= Number(f.max)) &&
      (!f.yield || p.yield >= Number(f.yield)) &&
      (f.tenure === "Any tenure" || p.tenure === f.tenure),
  );
}
export const examplePrompts = [
  "Show me all logistics assets in Europe yielding above 6.5%.",
  "What hotels are available in the Middle East below AED 500 million?",
  "Compare the three highest-yielding office assets in the UK.",
  "Show me income-producing logistics investments in Europe between €50m and €150m, above 6%, excluding leasehold.",
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
    results = [...results].sort((a, b) => b.yield - a.yield).slice(0, 3);
  return { filters, criteria, results, compare };
}
