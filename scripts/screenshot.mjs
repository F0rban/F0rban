/**
 * Captures screenshots of the running app.
 *
 * Usage:  npm run dev  (in another shell)
 *         node scripts/screenshot.mjs <name> <path> <width> <height> <theme> [full]
 *
 * Seeds localStorage so the app opens past onboarding on a realistic
 * workspace, which is what makes the captures reproducible.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , name = "shot", path = "/", w = "1440", h = "1000", theme = "dark", full = ""] =
  process.argv;

const outDir = process.env.SHOT_DIR ?? "screenshots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const base = process.env.BASE_URL ?? "http://localhost:3000";
await page.addInitScript((t) => {
  try {
    localStorage.setItem("acc.theme", t);
  } catch {}
}, theme);

await page.goto(`${base}${path}`, { waitUntil: "networkidle" });

if (!process.env.KEEP_ONBOARDING) {
  await page.waitForFunction(() => Boolean(localStorage.getItem("acc.workspace.v1")), {
    timeout: 15000,
  });
  await page.evaluate((t) => {
    const raw = localStorage.getItem("acc.workspace.v1");
    if (!raw) return;
    const ws = JSON.parse(raw);
    ws.preferences.onboardingComplete = true;
    ws.preferences.displayName = "Alex";
    ws.preferences.theme = t;
    localStorage.setItem("acc.workspace.v1", JSON.stringify(ws));
  }, theme);
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
}

await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: full === "full" });
console.log(`saved ${outDir}/${name}.png`, errors.length ? `\nerrors: ${errors.join("\n")}` : "");
await browser.close();
