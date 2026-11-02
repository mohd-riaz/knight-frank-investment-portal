import "dotenv/config";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/prisma";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const id = randomUUID();
const clientId = randomUUID();
const clientEmail = `client-${clientId}@example.com`;
const email = `browser-${id}@example.com`;
const password = randomUUID();
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
async function main() {
  await db.user.create({
    data: {
      id,
      name: "Browser check owner",
      email,
      role: "owner",
      accounts: {
        create: {
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  await db.user.create({
    data: {
      id: clientId,
      name: "Browser check client",
      email: clientEmail,
      accounts: {
        create: {
          accountId: clientId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e: Error) => errors.push(e.message));
    await page.goto(origin + "/admin");
    await page.waitForURL(origin + "/admin/login");
    await page.getByLabel("Email address").fill(clientEmail);
    await page.locator("#password").fill(password);
    await page
      .getByRole("button", { name: "Sign in to administration", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "does not have admin access" })
      .waitFor();
    if (
      (await context.request.get(origin + "/api/admin/session")).status() !==
      401
    )
      throw Error("Rejected client session was not cleared");
    await page.getByLabel("Email address").fill(email);
    await page.locator("#password").fill(password);
    await page
      .getByRole("button", { name: "Sign in to administration", exact: true })
      .click();
    await page.waitForURL(origin + "/admin");
    const thumbnails = page.locator(".admin-thumbnail");
    await thumbnails.first().waitFor();
    if ((await thumbnails.count()) === 0)
      throw Error("No admin opportunity images rendered");
    for (const image of await thumbnails.all()) {
      const src = await image.getAttribute("src");
      if (!src?.startsWith("/api/properties/"))
        throw Error("Admin thumbnail bypassed the authenticated image route");
    }
    await page.waitForFunction(() => {
      const image =
        document.querySelector<HTMLImageElement>(".admin-thumbnail");
      return image?.complete && image.naturalWidth > 0;
    });
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Investor portal", exact: true })
      .waitFor();
    if (process.env.ADMIN_ACCOUNT_SCREENSHOT)
      await page.screenshot({
        path: process.env.ADMIN_ACCOUNT_SCREENSHOT,
        fullPage: false,
      });
    await page
      .getByRole("menuitem", { name: "Investor portal", exact: true })
      .click();
    await page.waitForURL(origin + "/overview");
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Sign out", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.goto(origin + "/admin");
    await page.locator(".portal-sidebar-trigger").click();
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Investor portal", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page.locator(".portal-sidebar-trigger").click();
    await page
      .getByRole("heading", { name: "Opportunities", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Users", exact: true }).click();
    await page.getByRole("heading", { name: "Users", exact: true }).waitFor();
    await page.screenshot({
      path: process.env.ADMIN_SCREENSHOT || "admin-users-check.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Invite user", exact: true })
      .click();
    await page.getByLabel("Full name", { exact: true }).fill("Sample client");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page
      .getByRole("button", { name: "Opportunities", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add opportunity", exact: true })
      .click();
    await page
      .getByLabel("Property name", { exact: true })
      .fill("Preview opportunity");
    await page
      .getByRole("button", { name: "Preview listing", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Preview opportunity", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Preview listing", exact: true })
      .click();
    await page
      .getByRole("tab", { name: "Media & access", exact: true })
      .click();
    if (process.env.ADMIN_MEDIA_SCREENSHOT)
      await page
        .getByRole("dialog")
        .screenshot({ path: process.env.ADMIN_MEDIA_SCREENSHOT });
    const photoInput = page.locator('input[type="file"][multiple]');
    const pdfInput = page.locator(
      'input[type="file"][accept="application/pdf"]',
    );
    const chooser = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: "Browse photographs", exact: true })
      .click();
    const photo = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKWQAAAAASUVORK5CYII=",
      "base64",
    );
    await (
      await chooser
    ).setFiles({ name: "first.png", mimeType: "image/png", buffer: photo });
    await photoInput.setInputFiles({
      name: "second.png",
      mimeType: "image/png",
      buffer: photo,
    });
    if ((await page.locator(".admin-upload-list li").count()) !== 2)
      throw Error("Additional image selection replaced earlier images");
    await page
      .getByRole("button", { name: "Remove first.png", exact: true })
      .click();
    if ((await page.locator(".admin-upload-list li").count()) !== 1)
      throw Error("Image removal failed");
    await pdfInput.setInputFiles({
      name: "invalid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid"),
    });
    await page.getByRole("alert").filter({ hasText: "choose a PDF" }).waitFor();
    await pdfInput.setInputFiles({
      name: "investment-memorandum.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nUpload preview"),
    });
    if ((await page.locator(".admin-upload-list li").count()) !== 2)
      throw Error("PDF selection failed");
    await page
      .getByRole("checkbox", { name: "Confidential opportunity" })
      .check();
    await page
      .getByRole("tab", { name: "Property details", exact: true })
      .click();
    await page
      .getByRole("tab", { name: "Media & access", exact: true })
      .click();
    if ((await page.locator(".admin-upload-list li").count()) !== 2)
      throw Error("Selections lost when switching tabs");
    await page.waitForFunction(() =>
      Array.from(
        document.querySelectorAll<HTMLImageElement>(".admin-file-preview img"),
      ).some((image) => image.complete && image.naturalWidth > 0),
    );
    if (process.env.ADMIN_MEDIA_SELECTED_SCREENSHOT)
      await page
        .getByRole("dialog")
        .screenshot({ path: process.env.ADMIN_MEDIA_SELECTED_SCREENSHOT });
    await page.setViewportSize({ width: 390, height: 844 });
    if (
      await page
        .getByRole("dialog")
        .evaluate((el: HTMLElement) => el.scrollWidth > el.clientWidth)
    )
      throw Error("Upload dialog overflows on mobile");
    if (process.env.ADMIN_MEDIA_MOBILE_SCREENSHOT)
      await page
        .getByRole("dialog")
        .screenshot({ path: process.env.ADMIN_MEDIA_MOBILE_SCREENSHOT });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page
      .getByRole("heading", { name: "Opportunities", exact: true })
      .waitFor();
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error("Mobile page overflows");
    if (errors.length) throw Error(errors.join("\n"));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("button", { name: "Open account menu", exact: true })
      .click();
    await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
    await page.waitForURL(origin + "/admin/login");
    if (
      (await context.request.get(origin + "/api/admin/session")).status() !==
      401
    )
      throw Error("Account-menu sign-out did not revoke session");
    await page
      .getByRole("button", { name: "Sign in to administration", exact: true })
      .waitFor();
    if (process.env.ADMIN_LOGIN_SCREENSHOT)
      await page.screenshot({
        path: process.env.ADMIN_LOGIN_SCREENSHOT,
        fullPage: true,
      });
    console.log(
      "Browser checks passed: admin login, client rejection, navigation, invitations, property preview, upload selection/removal/validation, tab persistence and mobile layout.",
    );
  } finally {
    await browser.close();
  }
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.user.deleteMany({ where: { id: { in: [id, clientId] } } });
    await db.$disconnect();
  });
