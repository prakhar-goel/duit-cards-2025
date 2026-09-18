import fs from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
const origin = "http://localhost:48152",
  out = "artifacts/qa/gallery-4.2.0";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Volumes/UserData/prakhargoel/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
});
const checks = [],
  errors = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({
      viewport: { width, height: width === 390 ? 844 : 1000 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin + "/c/leena-carethread");
    await expect(
      page.getByRole("tab", { name: "Person", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await page.getByRole("tab").nth(i).click();
      await expect(page.getByRole("tab").nth(i)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      const panel = page.getByRole("tabpanel");
      if (i === 5) {
        await expect(panel.locator("video")).toBeVisible();
        await panel.locator("video").evaluate(async (v) => {
          v.muted = true;
          await v.play();
        });
        await page.waitForTimeout(1200);
        expect(
          await panel.locator("video").evaluate((v) => v.currentTime),
        ).toBeGreaterThan(0);
      } else if (i !== 1 && i !== 2)
        await expect
          .poll(() =>
            panel
              .locator("img")
              .evaluate((img) => img.complete && img.naturalWidth > 0),
          )
          .toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({ path: `${out}/web-${width}-slide-${i + 1}.png` });
    }
    await page.getByRole("tab").nth(1).click();
    await page
      .getByRole("button", { name: "View original business card" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    checks.push(
      `${width}px: six slides, full artwork, MP4 playback, no horizontal overflow, card enlargement`,
    );
    expect(await page.locator("body").innerText()).not.toMatch(
      /fictional|demo|fake/i,
    );
    await page.close();
  }
  if (errors.length) throw Error(errors.join("; "));
  await fs.writeFile(
    `${out}/web-verification.json`,
    JSON.stringify({ date: new Date().toISOString(), checks, errors }, null, 2),
  );
  console.log(checks.join("\n"));
} finally {
  await browser.close();
}
