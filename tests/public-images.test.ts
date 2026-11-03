import { test } from "node:test";
import assert from "node:assert/strict";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GET } from "../src/app/api/property-images/[hash]/route";
import { db } from "../src/lib/prisma";

test("public cover delivery limits reads to published photos and never caches errors", async (t) => {
  const names = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_ENDPOINT_URL_S3",
    "AWS_REGION",
  ];
  const before = names.map((name) => process.env[name]);
  Object.assign(process.env, {
    AWS_ACCESS_KEY_ID: "test",
    AWS_SECRET_ACCESS_KEY: "test",
    AWS_ENDPOINT_URL_S3: "https://branch.storage.example",
    AWS_REGION: "eu-central-1",
  });
  t.after(() => {
    names.forEach((name, i) => {
      if (before[i] === undefined) delete process.env[name];
      else process.env[name] = before[i];
    });
    t.mock.restoreAll();
  });

  const hash = "a".repeat(64);
  let published = true;
  let mime = "image/jpeg";
  let fail = false;
  let lookups = 0;
  let downloads = 0;
  const propertyDelegate = db.property;
  const originalFindFirst = propertyDelegate.findFirst;
  // Prisma's dynamic delegate methods have no descriptor for t.mock.method.
  t.after(() => {
    propertyDelegate.findFirst = originalFindFirst;
  });
  Object.assign(propertyDelegate, {
    findFirst: async (args: unknown) => {
      lookups++;
      assert.deepEqual(args, {
        where: {
          publication: "published",
          image: { endsWith: `/opportunity-media/sha256/${hash}` },
        },
        select: { id: true },
      });
      return published ? { id: "published-property" } : null;
    },
  });
  t.mock.method(
    S3Client.prototype,
    "send",
    async (command: GetObjectCommand) => {
      downloads++;
      assert.ok(command instanceof GetObjectCommand);
      assert.deepEqual(command.input, {
        Bucket: "opportunity-media",
        Key: `sha256/${hash}`,
      });
      if (fail) throw new Error("Storage unavailable");
      return {
        ContentType: mime,
        Body: {
          transformToWebStream: () =>
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode("photo bytes"));
                controller.close();
              },
            }),
        },
      };
    },
  );
  const request = (value = hash, query = "") =>
    GET(
      new Request(
        `https://portal.example/api/property-images/${value}${query}`,
      ),
      {
        params: Promise.resolve({ hash: value }),
      },
    );

  const response = await request();
  assert.equal(response.status, 200, "published photos need no session cookie");
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=2592000, s-maxage=2592000, immutable",
  );
  assert.equal(
    response.headers.get("location"),
    null,
    "cache image bytes, not expiring redirects",
  );
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get("vary"), null);
  assert.equal(await response.text(), "photo bytes");

  for (const value of ["not-a-hash", "../private", "a".repeat(63)]) {
    const invalid = await request(value);
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get("cache-control"), "private, no-store");
  }
  assert.equal((await request(hash, "?extra=cache-key")).status, 400);
  assert.equal(lookups, 1, "invalid URLs must not query the database");
  assert.equal(downloads, 1);

  // A PDF/material key or an unpublished-only cover has no published cover reference.
  published = false;
  const hidden = await request();
  assert.equal(hidden.status, 404);
  assert.equal(hidden.headers.get("cache-control"), "private, no-store");
  assert.equal(
    downloads,
    1,
    "unpublished objects must not be read from storage",
  );

  published = true;
  const errors: unknown[] = [];
  t.mock.method(console, "error", (...args: unknown[]) => errors.push(args));
  mime = "application/pdf";
  const document = await request();
  assert.equal(document.status, 503);
  assert.equal(document.headers.get("cache-control"), "private, no-store");
  assert.doesNotMatch(await document.text(), /photo bytes/);
  mime = "image/jpeg";
  fail = true;
  const unavailable = await request();
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("cache-control"), "private, no-store");
  assert.equal(errors.length, 2);
});
