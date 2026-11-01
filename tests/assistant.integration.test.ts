import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/prisma";

test(
  "assistant HTTP flow with real Postgres and a mocked OpenRouter service",
  { timeout: 90000 },
  async () => {
    const origin = "http://127.0.0.1:3101";
    const id = randomUUID();
    const email = `assistant-${id}@example.com`;
    const password = "Assistant-integration-test-2026!";
    const server = spawn(
      process.execPath,
      [
        "--require",
        resolve("tests/fixtures/openrouter.cjs"),
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3101",
      ],
      {
        env: {
          ...process.env,
          BETTER_AUTH_URL: origin,
          OPENROUTER_API_KEY: "mock-test-key",
        },
        stdio: "pipe",
      },
    );
    let logs = "";
    server.stdout.on("data", (data) => {
      logs += data.toString();
    });
    server.stderr.on("data", (data) => {
      logs += data.toString();
    });
    let cookie = "";
    const call = (body: unknown, session = cookie, requestOrigin = origin) =>
      fetch(origin + "/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: requestOrigin,
          Cookie: session,
        },
        body: JSON.stringify(body),
      });
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null)
          throw new Error(`Test server exited: ${logs}`);
        try {
          const r = await fetch(origin + "/login");
          if (r.ok) {
            ready = true;
            break;
          }
        } catch {
          /* Wait for startup. */
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      assert.ok(ready, logs);
      await db.user.create({
        data: {
          id,
          email,
          name: "Assistant QA",
          accounts: {
            create: {
              accountId: id,
              providerId: "credential",
              password: await hashPassword(password),
            },
          },
        },
      });
      const base = {
        position: 9999,
        city: "London",
        country: "United Kingdom",
        region: "UK",
        asset: "Offices",
        currency: "GBP",
        price: 10,
        yield: 7,
        tenure: "Freehold",
        image: "",
        label: "",
        summary: "Sample fixture",
        highlights: [],
      };
      await db.property.createMany({
        data: [
          {
            ...base,
            id: `${id}-a`,
            name: "Assistant integration fixture A",
            yield: 8,
          },
          {
            ...base,
            id: `${id}-b`,
            name: "Assistant integration fixture B",
            tenure: "Leasehold",
          },
          {
            ...base,
            id: `${id}-private`,
            name: "Assistant integration fixture private",
            confidential: true,
            yield: 99,
          },
          {
            ...base,
            id: `${id}-sold`,
            name: "Assistant integration fixture sold",
            label: "Sold at auction",
            yield: 98,
          },
          {
            ...base,
            id: `${id}-unknown`,
            name: "Assistant integration fixture unknown",
            yield: null,
          },
        ],
      });
      assert.equal((await call({ message: "initial" }, "")).status, 401);
      const login = await fetch(origin + "/api/auth/sign-in/email", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(login.status, 200);
      cookie = login.headers.get("set-cookie")!.split(";")[0];
      assert.equal(
        (
          await call(
            { message: "initial" },
            cookie,
            "https://untrusted.example",
          )
        ).status,
        403,
      );
      assert.equal((await call({ message: "x".repeat(2001) })).status, 400);
      assert.equal((await call({ message: "x".repeat(41000) })).status, 413);
      const response = await call({ message: "initial" });
      assert.equal(response.status, 200);
      const first = await response.json();
      assert.equal(first.result.total, 2);
      assert.deepEqual(
        first.result.results.map((p: { id: string }) => p.id),
        [`${id}-a`, `${id}-b`],
      );
      assert.ok(!JSON.stringify(first).includes("mock-test-key"));
      const next = await (
        await call({
          message: "only freehold",
          previous: first.plan,
          previousIds: first.result.results.map((p: { id: string }) => p.id),
        })
      ).json();
      assert.equal(next.result.total, 1);
      assert.equal(next.plan.filters.max, "20");
      assert.equal(next.plan.filters.region[0], "UK");
      const empty = await (await call({ message: "no matches" })).json();
      assert.equal(empty.result.total, 0);
      assert.equal(empty.plan.filters.currency, "AED");
      assert.equal((await call({ message: "provider failure" })).status, 503);
      const key = `assistant:60000:${id}`;
      const beforeRetry = await db.rateLimit.findUniqueOrThrow({
        where: { key },
      });
      const recovered = await call({ message: "recover after three failures" });
      assert.equal(recovered.status, 200);
      assert.equal((await recovered.json()).result.total, 2);
      const afterRetry = await db.rateLimit.findUniqueOrThrow({
        where: { key },
      });
      // At a minute boundary the counter legitimately resets to one.
      assert.equal(
        afterRetry.count,
        afterRetry.lastRequest === beforeRetry.lastRequest
          ? beforeRetry.count + 1
          : 1,
      );
      const summaryFailure = await call({ message: "summary unavailable" });
      assert.equal(summaryFailure.status, 200);
      const cards = await summaryFailure.json();
      assert.equal(cards.result.results.length, 2);
      assert.match(cards.text, /written summary is unavailable/);
      await db.rateLimit.update({
        where: { key },
        data: {
          count: 0,
          lastRequest: BigInt(Math.floor(Date.now() / 60000) * 60000),
        },
      });
      const requests = await Promise.all(
        Array.from({ length: 12 }, () => call({ message: "no matches" })),
      );
      assert.equal(requests.filter((r) => r.status === 200).length, 10);
      assert.equal(requests.filter((r) => r.status === 429).length, 2);
    } finally {
      server.kill();
      await db.rateLimit.deleteMany({ where: { key: { endsWith: id } } });
      await db.property.deleteMany({ where: { id: { startsWith: id } } });
      await db.user.deleteMany({ where: { id } });
      await db.$disconnect();
    }
  },
);
