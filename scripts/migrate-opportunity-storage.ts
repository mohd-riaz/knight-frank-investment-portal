import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/prisma";
import {
  storeObject,
  verifyObject,
  objectUrl,
  keyFromObjectUrl,
} from "../src/lib/object-storage";
import {
  catalogImages,
  sampleMemorandumKey,
  placeholderKey,
} from "../src/lib/storage-references";

// Re-running is safe: object identity is its SHA-256; shared listings reuse the same key.
const root = process.cwd();
const backup = path.join(root, ".qa", "storage-migration-backup");
const copies = new Map<string, Promise<{ objectKey: string; url: string }>>();
async function copy(bytes: Uint8Array, mime: string) {
  const hash = createHash("sha256").update(bytes).digest("hex");
  let pending = copies.get(hash);
  if (!pending) {
    pending = (async () => {
      // Preserve a private local recovery copy before clearing any legacy DB bytes.
      await mkdir(backup, { recursive: true });
      await writeFile(path.join(backup, hash), bytes);
      const stored = await storeObject(bytes, mime);
      await verifyObject(stored.objectKey, hash);
      return stored;
    })();
    copies.set(hash, pending);
  }
  return pending;
}
async function localFile(
  relative: string,
  mime: string,
  expectedHash?: string,
) {
  let bytes: Buffer;
  try {
    bytes = await readFile(path.join(root, relative));
  } catch (error) {
    if (!expectedHash || (error as NodeJS.ErrnoException).code !== "ENOENT")
      throw error;
    try {
      const staged = relative.startsWith("public/assets/images/")
        ? path.join(
            root,
            ".qa/extracted-opportunity-images",
            relative.slice("public/assets/images/".length),
          )
        : path.join(backup, expectedHash);
      try {
        bytes = await readFile(staged);
      } catch {
        bytes = await readFile(path.join(backup, expectedHash));
      }
    } catch {
      await verifyObject(`sha256/${expectedHash}`, expectedHash);
      return {
        objectKey: `sha256/${expectedHash}`,
        url: objectUrl(`sha256/${expectedHash}`),
      };
    }
  }
  if (
    expectedHash &&
    createHash("sha256").update(bytes).digest("hex") !== expectedHash
  )
    throw new Error(`Source checksum mismatch: ${relative}`);
  return copy(bytes, mime);
}

async function main() {
  const sample = await localFile(
    "documents/sample-investment-memorandum.pdf",
    "application/pdf",
    sampleMemorandumKey.split("/")[1],
  );
  const placeholder = await localFile(
    "public/assets/images/office.jpg",
    "image/jpeg",
    placeholderKey.split("/")[1],
  );
  const legacy = await db.material.findMany({ orderBy: { createdAt: "asc" } });
  for (const file of legacy) {
    const stored = file.bytes
      ? await copy(file.bytes, file.mime)
      : file.url && file.objectKey
        ? file
        : null;
    if (!stored?.url || !stored.objectKey)
      throw new Error(`Material ${file.id} has no file source.`);
    await verifyObject(stored.objectKey, stored.objectKey.split("/")[1]);
    await db.$transaction(async (tx) => {
      await tx.material.update({
        where: { id: file.id },
        data: { url: stored.url, objectKey: stored.objectKey, bytes: null },
      });
      if (file.kind === "photo")
        await tx.property.updateMany({
          where: { id: file.propertyId, image: `/api/materials/${file.id}` },
          data: { image: stored.url! },
        });
      if (file.kind === "im")
        await tx.property.update({
          where: { id: file.propertyId },
          data: {
            memorandumUrl: stored.url,
            memorandumKey: stored.objectKey,
            memorandumSample: false,
          },
        });
    });
  }

  const groups = await db.property.groupBy({ by: ["image"] });
  for (const { image } of groups) {
    if (image.startsWith("https://")) {
      const key = keyFromObjectUrl(image);
      await verifyObject(key, key.split("/")[1]);
      continue;
    }
    const photo = catalogImages.get(image);
    const stored =
      image === "office"
        ? placeholder
        : await localFile(
            `public/assets/images/${image}.jpg`,
            "image/jpeg",
            photo?.sha256,
          );
    await db.property.updateMany({
      where: { image },
      data: { image: stored.url },
    });
  }
  await db.property.updateMany({
    where: { memorandumKey: null },
    data: {
      memorandumUrl: sample.url,
      memorandumKey: sample.objectKey,
      memorandumSample: true,
    },
  });
  const [properties, remainingBytes, missingReferences] = await Promise.all([
    db.property.findMany({
      select: {
        id: true,
        image: true,
        memorandumUrl: true,
        memorandumKey: true,
      },
    }),
    db.material.count({ where: { bytes: { not: null } } }),
    db.material.count({ where: { OR: [{ url: null }, { objectKey: null }] } }),
  ]);
  if (
    remainingBytes ||
    missingReferences ||
    properties.some(
      (p) =>
        !p.image.startsWith("https://") || !p.memorandumUrl || !p.memorandumKey,
    )
  )
    throw new Error(
      "Migration incomplete; original files have been preserved.",
    );
  const imageUrls = new Set(properties.map((p) => p.image));
  console.log(
    `Verified ${properties.length} opportunity references, ${imageUrls.size} unique cover images, and no remaining database file bytes. Shared files stored once.`,
  );
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Storage migration failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
