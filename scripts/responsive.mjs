/**
 * Horizontal-overflow sweep across every route at the widths that matter.
 *
 * Usage:  npm run dev   (in another shell)
 *         npm run responsive
 *
 * Charts measure their own container, and a grid item with the default
 * min-width:auto can let one ratchet its track wider than the viewport — a
 * class of bug that is invisible on a desktop and obvious on a phone.
 */
import { chromium } from "playwright";

const ROUTES = [
  "/",
  "/duels",
  "/duels/new",
  "/duels/d-code-review-0",
  "/verdicts",
  "/prompts",
  "/models",
  "/spend",
  "/tools",
  "/projects",
  "/projects/pr-atlas",
  "/settings",
];

const WIDTHS = [360, 390, 640, 768, 1024, 1180, 1280, 1920];
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("acc.theme", "dark");
    } catch {}
  });
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(localStorage.getItem("acc.workspace.v1")), {
    timeout: 20000,
  });
  await page.evaluate(() => {
    const ws = JSON.parse(localStorage.getItem("acc.workspace.v1"));
    ws.preferences.onboardingComplete = true;
    localStorage.setItem("acc.workspace.v1", JSON.stringify(ws));
  });

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const result = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
      offender: (() => {
        const w = window.innerWidth;
        for (const el of document.querySelectorAll("*")) {
          const r = el.getBoundingClientRect();
          if (r.right > w + 2 && r.width > 40) {
            return `${el.tagName}.${(el.className || "").toString().slice(0, 80)}`;
          }
        }
        return null;
      })(),
    }));
    if (result.doc > result.win + 1) {
      failures++;
      console.log(`${width}px ${route}: ${result.doc} > ${result.win}  ${result.offender ?? ""}`);
    }
  }

  await context.close();
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} route/width combination${failures === 1 ? "" : "s"} overflow horizontally.`);
  process.exitCode = 1;
} else {
  console.log(
    `No horizontal overflow across ${WIDTHS.length} widths × ${ROUTES.length} routes.`,
  );
}
