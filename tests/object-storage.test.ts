import { test } from "node:test";
import assert from "node:assert/strict";
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  storeObject,
  objectUrl,
  keyFromObjectUrl,
} from "../src/lib/object-storage";

test("identical files reuse one storage object and URLs resolve on the active branch", async (t) => {
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
    AWS_ENDPOINT_URL_S3: "https://branch-a.storage.example",
    AWS_REGION: "eu-central-1",
  });
  t.after(() =>
    names.forEach((name, i) => {
      if (before[i] === undefined) delete process.env[name];
      else process.env[name] = before[i];
    }),
  );
  const objects = new Map<
    string,
    { ContentLength: number; Metadata: Record<string, string> }
  >();
  let uploads = 0;
  t.mock.method(
    S3Client.prototype,
    "send",
    async (command: HeadObjectCommand | PutObjectCommand) => {
      const key = command.input.Key!;
      if (command instanceof HeadObjectCommand) {
        if (objects.has(key)) return objects.get(key);
        throw Object.assign(new Error("Not found"), {
          $metadata: { httpStatusCode: 404 },
        });
      }
      assert.ok(command instanceof PutObjectCommand);
      uploads++;
      objects.set(key, {
        ContentLength: (command.input.Body as Uint8Array).byteLength,
        Metadata: command.input.Metadata!,
      });
      return {};
    },
  );
  const bytes = Buffer.from("the same photograph");
  const first = await storeObject(bytes, "image/jpeg");
  const second = await storeObject(Buffer.from(bytes), "image/jpeg");
  assert.equal(first.reused, false);
  assert.equal(second.reused, true);
  assert.equal(first.url, second.url);
  assert.equal(first.objectKey, second.objectKey);
  assert.equal(uploads, 1);
  process.env.AWS_ENDPOINT_URL_S3 = "https://branch-b.storage.example";
  assert.equal(
    objectUrl(keyFromObjectUrl(first.url)),
    `https://branch-b.storage.example/opportunity-media/${first.objectKey}`,
  );
  assert.throws(() =>
    keyFromObjectUrl("https://untrusted.example/private/file"),
  );
  assert.throws(() => objectUrl("../../other-bucket"));
  objects.get(first.objectKey)!.ContentLength = 1;
  await assert.rejects(storeObject(bytes, "image/jpeg"), /checksum metadata/);
  assert.equal(
    uploads,
    1,
    "a failed integrity check must not overwrite an object",
  );
});
