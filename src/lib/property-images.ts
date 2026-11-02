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
  property: Pick<Property, "image"> & Partial<Pick<Property, "id">>,
) {
  const original =
    dimensions.get(property.image) ??
    dimensions.get(property.image.split("/").at(-1) || "");
  const hash = property.image.split("/").at(-1) || "";
  // A replacement cover gets a fresh browser cache entry immediately.
  const version = /^[a-f0-9]{64}$/.test(hash) ? `?v=${hash}` : "";
  return {
    unoptimized: true,
    src: property.id
      ? `/api/properties/${encodeURIComponent(property.id)}/image${version}`
      : property.image,
    width: original?.width ?? 1000,
    height: original?.height ?? (property.image === "tower" ? 668 : 667),
  };
}
