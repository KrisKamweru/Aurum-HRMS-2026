import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4200";
const EMAIL = process.env.VISUAL_SMOKE_EMAIL || "admin@aurumtest.local";
const PASSWORD = process.env.VISUAL_SMOKE_PASSWORD || "TestPass123!";
const OUT_DIR = getArg("--out") || "artifacts/visual-smoke-current";

const ROUTES = ["/dashboard", "/employees", "/attendance", "/profile"];
const THEMES = ["light", "dark"];

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return "";
  return process.argv[idx + 1];
}

function slug(route) {
  return route.replace(/^\//, "").replace(/\//g, "__") || "root";
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function run() {
  await ensureDir(OUT_DIR);
  for (const theme of THEMES) {
    await ensureDir(path.join(OUT_DIR, theme));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.startsWith("/auth/login"), { timeout: 30000 });

    const captures = [];
    for (const theme of THEMES) {
      await page.evaluate((t) => {
        localStorage.setItem("theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);

      for (const route of ROUTES) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(1800);
        const screenshotPath = path.join(OUT_DIR, theme, `${slug(route)}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        captures.push({ theme, route, file: screenshotPath });
      }
    }

    await fs.writeFile(
      path.join(OUT_DIR, "manifest.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: BASE_URL,
          routes: ROUTES,
          themes: THEMES,
          captures,
        },
        null,
        2
      )
    );

    console.log(`Captured ${captures.length} screenshots to ${OUT_DIR}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((err) => {
  console.error("visual-smoke failed:", err?.message || err);
  process.exit(1);
});

