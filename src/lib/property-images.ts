import manifest from "../datasets/october-2024-images.json";
import type { Property } from "../data";

const dimensions = new Map(
  manifest.images.map((image) => [image.image, image]),
);

export function propertyImage(property: Pick<Property, "image">) {
  const original = dimensions.get(property.image);
  return {
    unoptimized: property.image.startsWith("/api/materials/"),
    src: property.image.startsWith("/api/materials/")
      ? property.image
      : `/assets/images/${property.image}.jpg`,
    width: original?.width ?? 1000,
    height: original?.height ?? (property.image === "tower" ? 668 : 667),
  };
}
