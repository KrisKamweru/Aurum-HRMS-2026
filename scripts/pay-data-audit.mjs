import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:4200';
const PASSWORD = 'TestPass123!';
const FALLBACK_EMPLOYEE_ID = 'k5757svk6tb26z2r65safesgf17zcj8x';

const roles = [
  { key: 'super_admin', email: 'super.admin@aurumtest.local', canReachEmployeeDetail: true, canEditCompensation: true, canEditFinancial: true },
  { key: 'admin', email: 'admin@aurumtest.local', canReachEmployeeDetail: true, canEditCompensation: true, canEditFinancial: true },
  { key: 'manager', email: 'manager@aurumtest.local', canReachEmployeeDetail: true, canEditCompensation: false, canEditFinancial: false },
  { key: 'employee', email: 'employee@aurumtest.local', canReachEmployeeDetail: false, canEditCompensation: false, canEditFinancial: false },
];

function stripUrl(url) {
  return url.replace(BASE_URL, '');
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function logout(page) {
  const signOut = page.getByRole('button', { name: /sign out/i });
  if ((await signOut.count()) > 0) {
    await signOut.first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function login(page, email) {
  await page.goto(`${BASE_URL}/auth/login`);
  await settle(page);
  if ((await page.getByPlaceholder('you@company.com').count()) === 0) {
    await logout(page);
    await page.goto(`${BASE_URL}/auth/login`);
    await settle(page);
  }
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await settle(page);
}

async function clickTabIfPresent(page, tabName) {
  const tab = page.getByRole('button', { name: new RegExp(`^${tabName}$`, 'i') });
  if ((await tab.count()) === 0) return false;
  await tab.first().click().catch(() => {});
  await settle(page);
  return true;
}

async function waitForDeniedRedirect(page, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const p = stripUrl(page.url());
    if (p === '/dashboard' || p === '/auth/login') return p;
    await page.waitForTimeout(250);
  }
  return stripUrl(page.url());
}

async function getAccessibleEmployeePath(page) {
  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
  await settle(page);

  const rowViewLink = page.locator('a[href^="/employees/"]').first();
  if ((await rowViewLink.count()) > 0) {
    const href = await rowViewLink.getAttribute('href');
    if (href && href.startsWith('/employees/')) return href;
  }
  return `/employees/${FALLBACK_EMPLOYEE_ID}`;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const checks = [];

  for (const role of roles) {
    await login(page, role.email);

    const employeePath = role.canReachEmployeeDetail
      ? await getAccessibleEmployeePath(page)
      : `/employees/${FALLBACK_EMPLOYEE_ID}`;

    await page.goto(`${BASE_URL}${employeePath}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    let finalPath = stripUrl(page.url());
    if (!role.canReachEmployeeDetail && finalPath !== '/dashboard' && finalPath !== '/auth/login') {
      finalPath = await waitForDeniedRedirect(page);
    }
    const reached = finalPath.startsWith('/employees/');

    checks.push({
      role: role.key,
      area: 'route',
      check: 'employee_detail_reachability',
      expected: role.canReachEmployeeDetail,
      actual: reached,
      pass: reached === role.canReachEmployeeDetail,
      detail: finalPath,
    });

    if (reached) {
      const overviewTab = page.getByRole('button', { name: /overview/i });
      const detailLoaded = await overviewTab.first().waitFor({ state: 'visible', timeout: 7000 }).then(() => true).catch(() => false);

      if (!detailLoaded) {
        checks.push({
          role: role.key,
          area: 'detail',
          check: 'employee_detail_loaded',
          expected: true,
          actual: false,
          pass: false,
          detail: 'overview tab not visible',
        });
        await logout(page);
        continue;
      }

      const compensationTabOpened = await clickTabIfPresent(page, 'compensation');
      let compensationEditVisible = false;
      if (compensationTabOpened) {
        compensationEditVisible = (await page.locator('ui-grid-tile:has-text("Compensation Details") button:has-text("Edit")').count()) > 0;
      }
      checks.push({
        role: role.key,
        area: 'compensation',
        check: 'edit_button_visible',
        expected: role.canEditCompensation,
        actual: compensationEditVisible,
        pass: compensationEditVisible === role.canEditCompensation,
        detail: compensationTabOpened ? 'compensation tab opened' : 'compensation tab missing',
      });

      const financialTabOpened = await clickTabIfPresent(page, 'financial');
      let statutoryEditVisible = false;
      let bankingAddVisible = false;
      let allowanceAddVisible = false;
      let deductionAddVisible = false;
      if (financialTabOpened) {
        statutoryEditVisible = (await page.locator('ui-grid-tile:has-text("Statutory Information") button:has-text("Edit")').count()) > 0;
        bankingAddVisible = (await page.locator('ui-grid-tile:has-text("Banking Details") button:has-text("Add")').count()) > 0;
        allowanceAddVisible = (await page.locator('ui-grid-tile:has-text("Allowances") button:has-text("Add")').count()) > 0;
        deductionAddVisible = (await page.locator('ui-grid-tile:has-text("Deductions") button:has-text("Add")').count()) > 0;
      }

      for (const [name, actual] of [
        ['statutory_edit_visible', statutoryEditVisible],
        ['banking_add_visible', bankingAddVisible],
        ['allowance_add_visible', allowanceAddVisible],
        ['deduction_add_visible', deductionAddVisible],
      ]) {
        checks.push({
          role: role.key,
          area: 'financial',
          check: name,
          expected: role.canEditFinancial,
          actual,
          pass: actual === role.canEditFinancial,
          detail: financialTabOpened ? 'financial tab opened' : 'financial tab missing',
        });
      }
    }

    await logout(page);
  }

  const failed = checks.filter((c) => !c.pass);
  const summary = {
    generatedAt: new Date().toISOString(),
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
  };

  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'PAY-DATA-AUDIT.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, checks, failed }, null, 2));

  const lines = [];
  lines.push('# Pay Data Audit Checklist');
  lines.push('');
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Total checks: ${summary.total}`);
  lines.push(`- Passed: ${summary.passed}`);
  lines.push(`- Failed: ${summary.failed}`);
  lines.push('');
  lines.push('## Matrix');
  lines.push('- `super_admin/admin`: can view + edit compensation/financial controls');
  lines.push('- `manager`: can view employee detail, compensation data; cannot see edit/add financial controls');
  lines.push('- `employee`: cannot reach other employee detail routes');
  lines.push('');
  lines.push('## Failures');
  if (failed.length === 0) {
    lines.push('- None');
  } else {
    for (const f of failed) {
      lines.push(`- ${f.role} :: ${f.area}/${f.check} expected=${f.expected} actual=${f.actual} detail=${f.detail}`);
    }
  }
  lines.push('');
  lines.push('## Recommendations');
  lines.push('- Keep backend role checks as source of truth and UI controls strictly hidden for non-authorized roles (now aligned for pay-data controls).');
  lines.push('- Add maker-checker workflow for compensation and payroll adjustments so admins/managers cannot self-approve sensitive pay changes.');
  lines.push('- Add automated negative-path tests for unauthorized mutation attempts (direct API calls) in Convex test harness.');
  lines.push('');
  lines.push('Raw JSON: `docs/PAY-DATA-AUDIT.json`');

  const mdPath = path.join(outDir, 'PAY-DATA-AUDIT-CHECKLIST.md');
  fs.writeFileSync(mdPath, lines.join('\n'));

  await browser.close();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ summary, jsonPath, mdPath }, null, 2));
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
