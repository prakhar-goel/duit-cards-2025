#!/usr/bin/env node
// Actual public-profile recording. Opens the local enquiry form; never submits it.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const out = path.join(root, "artifacts/videos/visual-iteration/captures");
await fs.mkdir(out, { recursive: true });
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ||
    path.join(
      os.homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
try {
  const origin = process.env.DUIT_QA_ORIGIN || "http://localhost:48152";
  const viewport = { width: 432, height: 936 };
  const errors = [];
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(out, ".raw"), size: viewport },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const pause = (milliseconds) => page.waitForTimeout(milliseconds);
  try {
    await page.goto(origin + "/c/maya-desai-demo", {
      waitUntil: "networkidle",
    });
    await page.locator("#story-tab-0").waitFor({ state: "visible" });
    await page.locator("#story-page-0 img").evaluate(async (image) => {
      if (!image.complete)
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
      if (!image.naturalWidth) throw new Error("Missing portrait image");
    });
    await pause(1500);
    await page.screenshot({ path: path.join(out, "web-person.png") });
    await page.locator("#story-tab-1").click();
    await pause(2300);
    await page.locator("#story-page-1 img").evaluate((image) => {
      if (!image.complete || !image.naturalWidth)
        throw new Error("Missing business card image");
    });
    await page.screenshot({ path: path.join(out, "web-card.png") });
    await page.locator("#story-tab-2").click();
    await pause(2700);
    await page.locator("#story-page-2 img").evaluate((image) => {
      if (!image.complete || !image.naturalWidth)
        throw new Error("Missing business cover image");
    });
    await page.screenshot({ path: path.join(out, "web-business.png") });
    await page
      .getByRole("button", {
        name: "Tell me what you are building",
        exact: true,
      })
      .click();
    await page
      .getByLabel("Your name", { exact: true })
      .waitFor({ state: "visible" });
    await pause(2400);
    await page.screenshot({ path: path.join(out, "web-enquiry.png") });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.locator("#story-tab-0").click();
    await pause(1800);
    if (errors.length) throw new Error("Page errors: " + errors.join("; "));
  } finally {
    await context.close();
    await page.video().saveAs(path.join(out, "recipient-web.webm"));
    await page.video().delete();
  }
  const companion = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const stillPage = await companion.newPage();
  try {
    for (const person of ["aisha-rahman", "sofia-laurent"]) {
      await stillPage.goto(origin + "/c/" + person + "-demo", {
        waitUntil: "networkidle",
      });
      for (const [index, label] of ["person", "card", "business"].entries()) {
        await stillPage.locator("#story-tab-" + index).click();
        await stillPage.waitForTimeout(450);
        await stillPage
          .locator("#story-page-" + index + " img")
          .evaluate((image) => {
            if (!image.complete || !image.naturalWidth)
              throw new Error("Missing companion profile image");
          });
        await stillPage.screenshot({
          path: path.join(out, person + "-" + label + ".png"),
        });
      }
    }
  } finally {
    await companion.close();
  }
  await fs.writeFile(
    path.join(out, "web-provenance.json"),
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        url: origin + "/c/maya-desai-demo",
        viewport,
        videoSize: viewport,
        captureLabel: "Actual phone browser · fictional demo",
        pageErrors: errors,
        actions: [
          "Person page",
          "Card page uncropped",
          "Business page",
          "Open enquiry modal without sending",
          "Return to Person",
        ],
        noMessageSent: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Recorded recipient-web.webm and four actual phone-browser screenshots; no message sent.",
  );
} finally {
  await browser.close();
}
