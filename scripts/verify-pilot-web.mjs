import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(root, ".env.local"));
const origin = process.env.DUIT_QA_ORIGIN || "http://localhost:48152";
const out = path.join(root, "artifacts/qa/web");
fs.mkdirSync(out, { recursive: true });
const credentials = JSON.parse(
  fs.readFileSync(path.join(root, ".local/credentials.json"), "utf8"),
);
const credential = (email) =>
  credentials.accounts.find((a) => a.email === email);
const key = `qa-web-${Date.now()}`;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const checks = [],
  errors = [];
let shareId, recipientId;
async function api(route, { token, body, method = "GET" } = {}) {
  const r = await fetch(origin + "/api/v1" + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(`${method} ${route}: ${r.status} ${d.error?.message}`);
  return d;
}
const login = (email) =>
  api("/auth/login", { method: "POST", body: credential(email) });
async function shot(page, name) {
  await page.screenshot({
    path: path.join(out, name + ".png"),
    animations: "disabled",
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow, `${name} horizontal overflow`).toBe(false);
}
try {
  const operator = await login("admin@pilot.duit.test"),
    maya = await login("maya@demo.duit.test");
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 1020 },
  });
  await adminContext.addInitScript(
    (auth) =>
      sessionStorage.setItem("duit.pilot.web.session", JSON.stringify(auth)),
    operator,
  );
  const admin = await adminContext.newPage();
  admin.on("pageerror", (e) => errors.push(e.message));
  await admin.goto(origin + "/admin");
  await expect(
    admin.getByRole("heading", { name: "Good connections. Real progress." }),
  ).toBeVisible();
  await expect(admin.getByLabel("Data source")).toHaveValue("fictional_demo");
  await shot(admin, "01-admin-overview");
  await admin.getByLabel("Data source").selectOption("user_created");
  await expect(
    admin.getByText("LIVE PILOT ACTIVITY", { exact: true }),
  ).toBeVisible();
  checks.push("Operator can separate fictional and live pilot metrics");
  await admin.getByRole("button", { name: "People & accounts" }).click();
  await admin.getByPlaceholder("Search name or email…").fill("Maya");
  await expect(
    admin.getByRole("row").filter({ hasText: "maya@demo.duit.test" }),
  ).toBeVisible();
  await admin
    .getByRole("row")
    .filter({ hasText: "maya@demo.duit.test" })
    .click();
  await expect(admin.getByRole("dialog")).toBeVisible();
  await expect(
    admin.getByText("Meeting notes and private contacts are not exposed"),
  ).toBeVisible();
  await admin.getByRole("button", { name: "Close", exact: true }).click();
  checks.push("Operator account search/detail respects private-note boundary");
  await admin.getByRole("button", { name: "Business profiles" }).click();
  await admin
    .getByPlaceholder("Find a person, business or profile…")
    .fill("Northstar");
  await expect(
    admin.getByRole("heading", { name: "Maya Desai", exact: true, level: 3 }),
  ).toBeVisible();
  await shot(admin, "02-admin-profiles");
  checks.push("Business profile search returns the matching business");
  await admin.getByRole("button", { name: "Archive library" }).click();
  await admin
    .getByPlaceholder("Search a person, business or story…")
    .fill("Prakhar");
  await admin
    .getByRole("button")
    .filter({
      has: admin.getByRole("heading", { name: "Prakhar Goel", exact: true }),
    })
    .click();
  await expect(admin.getByRole("dialog")).toBeVisible();
  await expect(
    admin.getByText("Received e-cards", { exact: true }),
  ).toBeVisible();
  await admin.waitForTimeout(400);
  await shot(admin, "03-archive-prakhar");
  await admin.getByRole("button", { name: "Close", exact: true }).click();
  await admin
    .getByPlaceholder("Search a person, business or story…")
    .fill("Amandeep Singh");
  await admin
    .getByRole("button")
    .filter({
      has: admin.getByRole("heading", { name: "Amandeep Singh", exact: true }),
    })
    .click();
  await admin.waitForTimeout(400);
  await shot(admin, "04-archive-amandeep");
  await admin.getByRole("button", { name: "Close", exact: true }).click();
  await admin.getByPlaceholder("Search a person, business or story…").fill("");
  await admin.getByLabel("Archive country").selectOption("62");
  await expect(admin.locator(".archive-tile").first()).toBeVisible();
  await shot(admin, "05-archive-indonesia");
  checks.push(
    "Private archive search, portrait/card details and phone-region filter work",
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/c/maya-desai-demo");
  await expect(
    page.getByRole("heading", { name: "Maya Desai", exact: true, level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByText("Fictional demo profile", { exact: true }),
  ).toBeVisible();
  await shot(page, "06-public-phone");
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Card", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByAltText("Maya Desai’s business card")).toBeVisible();
  await page
    .getByRole("button", { name: "Share profile", exact: true })
    .click();
  await expect(page.getByAltText("QR code to open this profile")).toBeVisible();
  await shot(page, "07-public-qr");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const vcf = await fetch(
    origin + "/api/v1/public/cards/maya-desai-demo/vcard",
  );
  expect(vcf.ok).toBe(true);
  expect(await vcf.text()).toContain("BEGIN:VCARD");
  checks.push(
    "Signed-out three-page visual profile, card navigation, real QR and vCard work",
  );
  await page
    .getByRole("button", { name: "Tell me what you are building" })
    .first()
    .click();
  await page.getByLabel("Your name", { exact: true }).fill(key);
  await page.getByLabel("Email", { exact: true }).fill(key + "@example.test");
  await page
    .getByLabel("What would you like to talk about?")
    .fill("A private browser verification, to be removed after the check.");
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name: "Send introduction" }).click();
  await expect(page.getByText("Your note is in Maya’s inbox.")).toBeVisible();
  await shot(page, "08-public-introduction");
  checks.push(
    "Consented signed-out introduction persists into the owner inbox",
  );
  await page.getByRole("button", { name: "Back to the profile" }).click();
  const cards = await api("/cards", { token: maya.accessToken });
  const card = cards.cards.find((c) => c.slug === "maya-desai-demo");
  const email = key + "-claim@example.test";
  const share = await api(`/cards/${card.id}/shares`, {
    token: maya.accessToken,
    method: "POST",
    body: {
      channel: "link",
      recipientDraft: {
        name: "Alex River",
        email,
        company: "A private draft",
        role: "Founder",
      },
    },
  });
  shareId = share.shareId;
  await page.goto(origin + "/s/" + share.token);
  await page.getByRole("button", { name: "Your profile is waiting" }).click();
  await page.getByLabel("Your email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Verify my email", exact: true })
    .click();
  await expect(page.getByText(/No email has been sent/)).toBeVisible();
  const outbox = await api("/admin/outbox?limit=200", {
    token: operator.accessToken,
  });
  const mail = outbox.messages.find((m) => m.recipient === email);
  expect(mail).toBeTruthy();
  await page
    .getByLabel("Verification token", { exact: true })
    .fill(mail.payload.verificationToken);
  await page
    .getByRole("button", { name: "Review my details", exact: true })
    .click();
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Alex River",
  );
  await page
    .getByLabel("Your name", { exact: true })
    .fill("Alex River — reviewed");
  await page
    .getByLabel("Create a password", { exact: true })
    .fill(process.env.PILOT_SEED_PASSWORD);
  await page.getByText("I’ve reviewed these details").click();
  await page
    .getByRole("button", { name: "Accept my profile", exact: true })
    .click();
  await expect(
    page.getByText("Your private profile draft is saved."),
  ).toBeVisible();
  recipientId = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("duit.pilot.web.session")).user.id,
  );
  checks.push(
    "Recipient draft stays hidden until verification, then is reviewed and accepted into its matching account",
  );
  await shot(page, "09-claim-complete");
  await page.setViewportSize({ width: 1440, height: 1020 });
  await page.goto(origin + "/c/maya-desai-demo");
  await expect(
    page.getByRole("heading", { name: "Maya Desai", exact: true, level: 2 }),
  ).toBeVisible();
  await shot(page, "10-public-desktop");
  await page.goto(origin + "/");
  await shot(page, "11-product-home");
  expect(errors).toEqual([]);
  checks.push(
    "Desktop and phone layouts have no horizontal overflow or uncaught browser errors",
  );
  console.log(
    JSON.stringify(
      { passed: checks.length, checks, screenshots: out },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(out, "verification.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        passed: checks.length,
        checks,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  if (shareId)
    await pool.query("DELETE FROM share_links WHERE id=$1", [shareId]);
  await pool.query("DELETE FROM local_outbox WHERE recipient=$1", [
    key + "-claim@example.test",
  ]);
  await pool.query("DELETE FROM leads WHERE name=$1 AND email=$2", [
    key,
    key + "@example.test",
  ]);
  if (recipientId)
    await pool.query("DELETE FROM users WHERE id=$1 AND email=$2", [
      recipientId,
      key + "-claim@example.test",
    ]);
  await pool.end();
}
