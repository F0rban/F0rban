/**
 * WCAG 2.1 AA scan across every route, in both themes.
 *
 * Usage:  npm run dev   (in another shell)
 *         npm run a11y
 *
 * Exits non-zero if anything is reported, so it can gate a build.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

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

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let total = 0;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
});

for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("acc.theme", t);
    } catch {}
  }, theme);
  const page = await context.newPage();

  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(localStorage.getItem("acc.workspace.v1")), {
    timeout: 15000,
  });
  await page.evaluate((t) => {
    const ws = JSON.parse(localStorage.getItem("acc.workspace.v1"));
    ws.preferences.onboardingComplete = true;
    ws.preferences.theme = t;
    localStorage.setItem("acc.workspace.v1", JSON.stringify(ws));
  }, theme);

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    // Entrance animations transiently lower contrast; let them settle first.
    await page.waitForTimeout(1800);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    for (const violation of results.violations) {
      total += violation.nodes.length;
      console.log(`[${theme}] ${route} · ${violation.id} (${violation.impact}) ×${violation.nodes.length}`);
      console.log(`   ${violation.help}`);
      console.log(`   e.g. ${violation.nodes[0].html.slice(0, 160)}`);
    }
  }

  await context.close();
}

await browser.close();

if (total > 0) {
  console.error(`\n${total} violation${total === 1 ? "" : "s"} found.`);
  process.exitCode = 1;
} else {
  console.log("axe: no WCAG 2.1 AA violations across all routes, in both themes.");
}
