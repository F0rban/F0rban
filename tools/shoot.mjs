// Harnais de capture : screenshots desktop + mobile de chaque page servie en local.
// Usage : node shoot.mjs <baseURL> <outDir> <page1> [page2...]
// Playwright est résolu depuis l'installation globale (npm i -g playwright).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const [, , base, outDir, ...pages] = process.argv;
const browser = await chromium.launch();

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  for (const p of pages) {
    const url = `${base}/${p}`.replace(/\/+$/, p === '' ? '/' : '');
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1800);
    const slug = (p || 'index').replace(/[\/.]/g, '_');
    await page.screenshot({ path: `${outDir}/${slug}-${vp.name}-top.png` });
    // capture pleine page (les animations au scroll sont forcées visibles par le script si data-shoot)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/${slug}-${vp.name}-full.png`, fullPage: true });
  }
  if (errors.length) console.log(`[${vp.name}] Erreurs console:\n` + errors.join('\n'));
  else console.log(`[${vp.name}] aucune erreur console`);
  await ctx.close();
}
await browser.close();
console.log('captures OK ->', outDir);
