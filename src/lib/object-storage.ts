// Server and migration scripts only. Never import this module into a client component.
import { createHash } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { contentKey, mediaBucket } from "./storage-references";

let client: S3Client | undefined;
const imageCacheSeconds = 5 * 60;
export const imageCacheControl = `private, max-age=${imageCacheSeconds}`;
function storage() {
  if (
    !process.env.AWS_ENDPOINT_URL_S3 ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION
  )
    throw new Error("Neon Object Storage is not configured.");
  return (client ??= new S3Client({
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  }));
}

export function objectUrl(key: string) {
  if (!/^sha256\/[a-f0-9]{64}$/.test(key))
    throw new Error("Invalid storage key.");
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint) throw new Error("Neon Object Storage is not configured.");
  return `${endpoint.replace(/\/$/, "")}/${mediaBucket}/${key}`;
}

// Read using the current branch's endpoint, even when a row was inherited from a parent.
export function keyFromObjectUrl(url: string) {
  const key = new URL(url).pathname.split(`/${mediaBucket}/`)[1];
  if (!key || !/^sha256\/[a-f0-9]{64}$/.test(key))
    throw new Error("Invalid stored file URL.");
  return key;
}

export async function storeObject(bytes: Uint8Array, mime: string) {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const objectKey = contentKey(sha256);
  let reused = false;
  try {
    const existing = await storage().send(
      new HeadObjectCommand({ Bucket: mediaBucket, Key: objectKey }),
    );
    if (
      existing.ContentLength !== bytes.byteLength ||
      existing.Metadata?.sha256 !== sha256
    )
      throw new Error("Stored file checksum metadata does not match.");
    reused = true;
  } catch (error) {
    if (
      (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode !== 404
    )
      throw error;
    await storage().send(
      new PutObjectCommand({
        Bucket: mediaBucket,
        Key: objectKey,
        Body: bytes,
        ContentType: mime,
        CacheControl: "private, no-store",
        Metadata: { sha256 },
      }),
    );
  }
  return { objectKey, url: objectUrl(objectKey), sha256, reused };
}

export async function verifyObject(key: string, expectedSha256: string) {
  const result = await storage().send(
    new GetObjectCommand({ Bucket: mediaBucket, Key: key }),
  );
  if (!result.Body) throw new Error("Stored file has no body.");
  const hash = createHash("sha256")
    .update(await result.Body.transformToByteArray())
    .digest("hex");
  if (hash !== expectedSha256)
    throw new Error("Stored file failed checksum verification.");
}

export async function signedImageUrl(url: string) {
  return getSignedUrl(
    storage(),
    new GetObjectCommand({
      Bucket: mediaBucket,
      Key: keyFromObjectUrl(url),
      ResponseCacheControl: imageCacheControl,
    }),
    // A cached redirect must remain usable for its entire five-minute lifetime.
    { expiresIn: imageCacheSeconds + 60 },
  );
}

export async function imageResponse(url: string) {
  return new Response(null, {
    status: 307,
    headers: {
      Location: await signedImageUrl(url),
      "Cache-Control": imageCacheControl,
      Vary: "Cookie",
    },
  });
}

// Only call after verifying that this object is a published property cover.
// Stream the bytes: caching a signed redirect would still download from Neon.
export async function publicImageResponse(key: string) {
  const result = await storage().send(
    new GetObjectCommand({ Bucket: mediaBucket, Key: key }),
  );
  if (
    !result.Body ||
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      result.ContentType || "",
    )
  )
    throw new Error("Stored cover is not a supported image.");
  return new Response(result.Body.transformToWebStream(), {
    headers: {
      "Content-Type": result.ContentType!,
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function documentResponse(key: string, sample: boolean) {
  const result = await storage().send(
    new GetObjectCommand({ Bucket: mediaBucket, Key: key }),
  );
  if (!result.Body) throw new Error("Stored document has no body.");
  return new Response(result.Body.transformToWebStream(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sample ? "sample-" : ""}investment-memorandum.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
