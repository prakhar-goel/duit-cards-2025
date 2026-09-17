// Capture actual browser interactions for the private narrated walkthrough.
// All generated identities are fictional and exact fixture records are removed.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";
import pg from "pg";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
process.loadEnvFile(path.join(root, ".env.local"));
const origin = process.env.DUIT_QA_ORIGIN || "http://localhost:48152";
const output = path.join(root, "artifacts/videos/captures");
fs.mkdirSync(output, { recursive: true });
const credentials = JSON.parse(
  fs.readFileSync(path.join(root, ".local/credentials.json"), "utf8"),
);
const key = `video-${Date.now()}`,
  email = key + "@example.test";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
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
  const d = await r.json();
  if (!r.ok) throw Error(`${route}: ${r.status}`);
  return d;
}
const login = (email) =>
  api("/auth/login", {
    method: "POST",
    body: credentials.accounts.find((a) => a.email === email),
  });
const pause = (p, ms = 1500) => p.waitForTimeout(ms);
async function record(name, size, auth, fn) {
  const context = await browser.newContext({
    viewport: size,
    recordVideo: { dir: path.join(output, ".raw"), size },
  });
  if (auth)
    await context.addInitScript(
      (a) =>
        sessionStorage.setItem("duit.pilot.web.session", JSON.stringify(a)),
      auth,
    );
  const page = await context.newPage();
  try {
    await fn(page);
    await pause(page, 2500);
  } finally {
    await context.close();
  }
  await page.video().saveAs(path.join(output, name + ".webm"));
  await page.video().delete();
  console.log("Recorded", name);
}
try {
  const maya = await login("maya@demo.duit.test"),
    admin = await login("admin@pilot.duit.test");
  await record(
    "public-profile",
    { width: 430, height: 932 },
    null,
    async (p) => {
      await p.goto(origin + "/c/maya-desai-demo");
      await expect(
        p.getByRole("heading", { name: "Maya Desai", exact: true }),
      ).toBeVisible();
      await pause(p, 3500);
      await p.getByRole("button", { name: "Next panel", exact: true }).click();
      await pause(p, 2000);
      await p.getByRole("button", { name: "Next panel", exact: true }).click();
      await pause(p, 1500);
      await p.evaluate(() => window.scrollTo({ top: 480, behavior: "smooth" }));
      await pause(p, 2000);
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await pause(p);
      await p
        .getByRole("button", { name: "Share profile", exact: true })
        .click();
      await expect(
        p.getByAltText("QR code to open this profile"),
      ).toBeVisible();
    },
  );
  await record(
    "public-enquiry",
    { width: 430, height: 932 },
    null,
    async (p) => {
      await p.goto(origin + "/c/maya-desai-demo");
      await p
        .getByRole("button", { name: "Tell me what you are building" })
        .first()
        .click();
      await pause(p);
      await p
        .getByLabel("Your name", { exact: true })
        .pressSequentially("Alex River", { delay: 65 });
      await p.getByLabel("Email", { exact: true }).fill(email);
      await p
        .getByLabel("What would you like to talk about?")
        .pressSequentially(
          "We are preparing a small event pilot. Could we discuss a clearer visitor introduction?",
          { delay: 25 },
        );
      await pause(p);
      await p.locator("input[type=checkbox]").check();
      await pause(p);
      await p.getByRole("button", { name: "Send introduction" }).click();
      await expect(p.getByText("Your note is in Maya’s inbox.")).toBeVisible();
    },
  );
  const cards = await api("/cards", { token: maya.accessToken });
  const card = cards.cards.find((c) => c.slug === "maya-desai-demo");
  const share = await api(`/cards/${card.id}/shares`, {
    token: maya.accessToken,
    method: "POST",
    body: {
      channel: "link",
      recipientDraft: {
        name: "Alex River",
        email,
        company: "River Workshop",
        role: "Founder",
      },
    },
  });
  shareId = share.shareId;
  await record(
    "recipient-claim",
    { width: 1440, height: 900 },
    null,
    async (p) => {
      await p.goto(origin + "/s/" + share.token);
      await p.getByRole("button", { name: "Your profile is waiting" }).click();
      await p.getByLabel("Your email", { exact: true }).fill(email);
      await p
        .getByRole("button", { name: "Verify my email", exact: true })
        .click();
      await expect(p.getByText(/No email has been sent/)).toBeVisible();
      await pause(p, 3500);
      const outbox = await api("/admin/outbox?limit=200", {
        token: admin.accessToken,
      });
      const mail = outbox.messages.find((m) => m.recipient === email);
      expect(mail).toBeTruthy();
      const field = p.getByLabel("Verification token", { exact: true });
      await field.evaluate((e) => e.setAttribute("type", "password"));
      await field.fill(mail.payload.verificationToken);
      await p
        .getByRole("button", { name: "Review my details", exact: true })
        .click();
      await expect(p.getByLabel("Your name", { exact: true })).toHaveValue(
        "Alex River",
      );
      await pause(p, 3500);
      await p
        .getByLabel("Company", { exact: true })
        .fill("River Workshop — reviewed");
      await p
        .getByLabel("Create a password", { exact: true })
        .fill(process.env.PILOT_SEED_PASSWORD);
      await p.getByText("I’ve reviewed these details").click();
      await pause(p);
      await p
        .getByRole("button", { name: "Accept my profile", exact: true })
        .click();
      await expect(
        p.getByText("Your private profile draft is saved."),
      ).toBeVisible();
      recipientId = await p.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("duit.pilot.web.session")).user.id,
      );
    },
  );
  await record(
    "admin-overview",
    { width: 1440, height: 900 },
    admin,
    async (p) => {
      await p.goto(origin + "/admin");
      await expect(
        p.getByRole("heading", { name: "Good connections. Real progress." }),
      ).toBeVisible();
      await pause(p, 4500);
      await p.getByLabel("Data source").selectOption("user_created");
      await pause(p, 3500);
      await p.getByLabel("Data source").selectOption("fictional_demo");
      await pause(p, 3500);
      await p.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    },
  );
  await record(
    "archive-founders",
    { width: 1440, height: 900 },
    admin,
    async (p) => {
      await p.goto(origin + "/admin");
      await p.getByRole("button", { name: "Archive library" }).click();
      await p
        .getByPlaceholder("Search a person, business or story…")
        .fill("Prakhar");
      await p
        .getByRole("button")
        .filter({
          has: p.getByRole("heading", { name: "Prakhar Goel", exact: true }),
        })
        .click();
      await expect(p.getByRole("dialog")).toBeVisible();
      await pause(p, 5500);
      await p
        .getByRole("dialog")
        .evaluate((e) => e.scrollTo({ top: 450, behavior: "smooth" }));
      await pause(p, 3500);
      await p.getByRole("button", { name: "Close", exact: true }).click();
      await p
        .getByPlaceholder("Search a person, business or story…")
        .fill("Amandeep Singh");
      await p
        .getByRole("button")
        .filter({
          has: p.getByRole("heading", { name: "Amandeep Singh", exact: true }),
        })
        .click();
      await pause(p, 5500);
    },
  );
  await record(
    "archive-gallery",
    { width: 1440, height: 900 },
    admin,
    async (p) => {
      await p.goto(origin + "/admin");
      await p.getByRole("button", { name: "Archive library" }).click();
      await expect(p.locator(".archive-tile").first()).toBeVisible();
      await pause(p, 3500);
      await p.evaluate(() => window.scrollTo({ top: 430, behavior: "smooth" }));
      await pause(p, 3000);
      await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await p.getByLabel("Archive country").selectOption("62");
      await pause(p, 3500);
      await p.evaluate(() => window.scrollTo({ top: 430, behavior: "smooth" }));
      await pause(p, 3500);
    },
  );
} finally {
  await browser.close();
  if (shareId)
    await pool.query("DELETE FROM share_links WHERE id=$1", [shareId]);
  await pool.query("DELETE FROM local_outbox WHERE recipient=$1", [email]);
  await pool.query("DELETE FROM leads WHERE email=$1", [email]);
  if (recipientId)
    await pool.query("DELETE FROM users WHERE id=$1 AND email=$2", [
      recipientId,
      email,
    ]);
  await pool.end();
}
