import images from "../datasets/october-2024-images.json";
import shared from "../datasets/shared-storage-assets.json";

export const mediaBucket = "opportunity-media";
export const contentKey = (sha256: string) => `sha256/${sha256}`;
export const catalogImages = new Map(
  images.images.map((image) => [image.image, image]),
);
export const placeholderKey = contentKey(shared.placeholder.sha256);
export const sampleMemorandumKey = contentKey(shared.sampleMemorandum.sha256);

export function catalogImageKey(image: string) {
  const photo = catalogImages.get(image);
  if (photo) return contentKey(photo.sha256);
  if (image === "office") return placeholderKey;
  throw new Error(`No migrated photograph for ${image}`);
}
