import type { Property } from "../data";

// Keep catalog provenance in the source files, outside the listing presentation.
export function presentProperty(property: Property): Property {
  const isRegionalCopy = /\s+—\s+.+\s+demo$/i.test(property.name);
  const isPlaceholderLabel =
    /^(?:Regional demo|October \d{4}|Sample|Demo)/i.test(property.label);
  return {
    ...property,
    name: property.name.replace(/\s+—\s+.+\s+demo$/i, ""),
    label: isPlaceholderLabel
      ? /sold/i.test(property.label)
        ? "Sold at auction"
        : ""
      : property.label,
    priceQualifier: /^(?:guide(?: from)?|from)$/i.test(
      property.priceQualifier ?? "",
    )
      ? ""
      : property.priceQualifier,
    summary: (isRegionalCopy
      ? property.summary.replace(/^Regional demo.*?unchanged\.\s*/i, "")
      : property.summary
    )
      .replace(/\b(?:sample|illustrative)\s+/gi, "")
      .replace(/^An (?=[^aeiou])/i, "A "),
    highlights: property.highlights.filter(
      (highlight) =>
        !/^(?:Source:|Regional demo only:|Asset class is unspecified in the source;)/i.test(
          highlight,
        ),
    ),
  };
}
