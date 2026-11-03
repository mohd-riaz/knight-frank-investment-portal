import manifest from "../datasets/october-2024-images.json";
import type { Property } from "../data";

const dimensions = new Map(
  manifest.images.flatMap(
    (image) =>
      [
        [image.image, image],
        [image.sha256, image],
      ] as const,
  ),
);

export function propertyImage(
  property: Pick<Property, "image"> & { id?: string; publication?: string },
) {
  const original =
    dimensions.get(property.image) ??
    dimensions.get(property.image.split("/").at(-1) || "");
  const hash = property.image.split("/").at(-1) || "";
  const published =
    !property.publication || property.publication === "published";
  const cacheable = !!property.id && published && /^[a-f0-9]{64}$/.test(hash);
  // Shared content URLs deduplicate regional copies and change on replacement.
  const version = /^[a-f0-9]{64}$/.test(hash) ? `?v=${hash}` : "";
  return {
    unoptimized: !cacheable,
    src: cacheable
      ? `/api/property-images/${hash}`
      : property.id
        ? `/api/properties/${encodeURIComponent(property.id)}/image${version}`
        : property.image,
    width: original?.width ?? 1000,
    height: original?.height ?? (property.image === "tower" ? 668 : 667),
  };
}
