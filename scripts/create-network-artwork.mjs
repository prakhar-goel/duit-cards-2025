import fs from "node:fs/promises";
import { chromium } from "@playwright/test";
import { newProfiles, originalBrands } from "./network-expansion-data.mjs";
const out = new URL("../apps/web/public/demo/", import.meta.url);
const font = await fs.readFile(
  new URL("./video/fonts/DM-Sans.ttf", import.meta.url),
);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROMIUM_EXECUTABLE_PATH ||
    "/Volumes/UserData/prakhargoel/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell",
});
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
try {
  for (const [index, p] of [...originalBrands, ...newProfiles].entries()) {
    const domain = p.domain || p.company.toLowerCase().replace(/[^a-z]/g, "");
    for (const kind of ["card", "back", "process"]) {
      if (kind === "card" && index < 6) continue;
      const portrait = index === 10;
      const width = portrait && kind !== "process" ? 750 : 1200,
        height = portrait && kind !== "process" ? 1200 : 750;
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const body =
        kind === "card"
          ? `<div class="eyebrow">${esc(p.city)} / ${p.country}</div><div class="brand">${esc(p.company)}</div><div class="mark">${["＋", "⌑", "☀", "◒", "◫", "↗"][index - 6]}</div><div class="bottom"><div><div class="name">${p.name}</div><div class="role">${p.role}</div></div><div class="email">${p.key}@${domain}.example</div></div>`
          : kind === "back"
            ? `<div class="eyebrow">${p.company}</div><h1>${p.steps.join("<br>")}</h1><div class="bottom"><div class="role">${p.details[0]}<br>${p.details[1]}</div><div class="email">${p.key}@${domain}.example</div></div>`
            : `<div class="eyebrow">${p.company} / How we work</div><h1 style="font-size:64px;margin-top:40px">A clear next step.</h1><div class="steps">${p.steps.map((step, i) => `<div class="step"><div class="number">0${i + 1}</div><h2>${step}</h2><p>${p.details[i]}</p></div>`).join("")}</div>`;
      await page.setContent(
        `<style>@font-face{font-family:DM;src:url(data:font/ttf;base64,${font.toString("base64")})}*{box-sizing:border-box}body{margin:0;font-family:DM;color:${kind === "card" ? p.paper : p.color};background:${kind === "card" ? p.color : p.paper}}main{position:relative;height:100vh;padding:65px;overflow:hidden}.eyebrow{font-size:19px;letter-spacing:3px;text-transform:uppercase}.brand{font-size:${portrait ? 90 : 96}px;font-weight:550;letter-spacing:-4px;max-width:88%;margin-top:70px;line-height:1}.mark{font-size:180px;opacity:.2;position:absolute;right:35px;top:170px}.bottom{position:absolute;bottom:60px;left:65px;right:65px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:35px;align-items:end}.name{font-size:38px}.role{font-size:20px;line-height:1.65;margin-top:10px}.email{font-size:18px}h1{font-size:${portrait ? 64 : 76}px;font-weight:500;letter-spacing:-3px;line-height:1.1;margin-top:65px}.steps{display:flex;gap:24px;margin-top:55px}.step{flex:1;border-top:2px solid;padding:22px 10px}.number{font-size:75px;opacity:.4}h2{font-size:27px;font-weight:500;line-height:1.15}p{font-size:18px;line-height:1.5}</style><main>${body}</main>`,
      );
      await page.evaluate(() => document.fonts.ready);
      const folder = kind === "process" ? "covers" : "cards";
      await fs.mkdir(new URL(folder + "/", out), { recursive: true });
      await page.screenshot({
        path: new URL(`${folder}/${p.key}-${kind}.png`, out).pathname,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(
  "Created front/back card artwork and visual business process slides.",
);
