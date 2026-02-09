import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4200';
const PASSWORD = process.env.VISUAL_SMOKE_PASSWORD || 'TestPass123!';
const OUT_DIR = getArg('--out') || 'artifacts/visual-smoke-current';
const ROUTES = (getArg('--routes') || '/dashboard,/employees,/attendance,/profile')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);
const THEMES = ['light', 'dark'];
const WAIT_MS = Number(getArg('--waitMs') || '2000');
const PROFILE_KEYS = (getArg('--profiles') || 'admin,manager,employee')
  .split(',')
  .map((profile) => profile.trim())
  .filter(Boolean);

const PROFILES = {
  super_admin: process.env.VISUAL_SMOKE_SUPER_ADMIN_EMAIL || 'super.admin@aurumtest.local',
  admin: process.env.VISUAL_SMOKE_ADMIN_EMAIL || 'admin@aurumtest.local',
  manager: process.env.VISUAL_SMOKE_MANAGER_EMAIL || 'manager@aurumtest.local',
  employee: process.env.VISUAL_SMOKE_EMPLOYEE_EMAIL || 'employee@aurumtest.local',
};

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return '';
  return process.argv[idx + 1];
}

function slug(route) {
  return route.replace(/^\//, '').replace(/\//g, '__') || 'root';
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(WAIT_MS);
}

async function applyDeterministicCaptureMode(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function applyTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  }, theme);
}

async function login(page, email) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 30000 });
  await settle(page);
}

async function logout(page) {
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  if ((await signOutButton.count()) > 0) {
    await signOutButton.first().click().catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function run() {
  const activeProfiles = PROFILE_KEYS.map((key) => ({
    key,
    email: PROFILES[key],
  })).filter((profile) => profile.email);

  if (activeProfiles.length === 0) {
    throw new Error('No valid profiles configured for visual smoke.');
  }

  await ensureDir(OUT_DIR);
  for (const profile of activeProfiles) {
    for (const theme of THEMES) {
      await ensureDir(path.join(OUT_DIR, profile.key, theme));
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    const captures = [];

    for (const profile of activeProfiles) {
      await login(page, profile.email);
      await applyDeterministicCaptureMode(page);

      for (const theme of THEMES) {
        await applyTheme(page, theme);

        for (const route of ROUTES) {
          await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await settle(page);
          const screenshotPath = path.join(OUT_DIR, profile.key, theme, `${slug(route)}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          captures.push({ profile: profile.key, theme, route, file: screenshotPath });
        }
      }

      await logout(page);
    }

    await fs.writeFile(
      path.join(OUT_DIR, 'manifest.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: BASE_URL,
          routes: ROUTES,
          themes: THEMES,
          profiles: activeProfiles.map((profile) => profile.key),
          captures,
        },
        null,
        2
      )
    );

    // eslint-disable-next-line no-console
    console.log(`Captured ${captures.length} screenshots to ${OUT_DIR}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('visual-smoke failed:', err?.message || err);
  process.exit(1);
});
