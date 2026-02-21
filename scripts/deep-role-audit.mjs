import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:4200';
const PASSWORD = 'TestPass123!';

const FIXTURES = {
  employeeId: 'k5757svk6tb26z2r65safesgf17zcj8x',
  payrollRunId: 'pn778np8eetvrkcayp681yj62n807ydx',
  slipId: 'ps76zzean41se5n9g36q6njwxd80qx53',
};

const roles = [
  { key: 'super_admin', email: 'super.admin@aurumtest.local' },
  { key: 'admin', email: 'admin@aurumtest.local' },
  { key: 'manager', email: 'manager@aurumtest.local' },
  { key: 'employee', email: 'employee@aurumtest.local' },
];

function buildRoutes(fixtures) {
  return [
    '/dashboard',
    '/profile',
    '/leave-requests',
    '/attendance',
    '/attendance/team',
    '/employees',
    `/employees/${fixtures.employeeId}`,
    '/recruitment/jobs',
    '/recruitment/jobs/new',
    '/recruitment/board',
    '/training/catalog',
    '/training/my-learning',
    '/training/courses/new',
    '/settings/general',
    '/settings/leave-policies',
    '/core-hr/promotions',
    '/core-hr/transfers',
    '/core-hr/awards',
    '/core-hr/warnings',
    '/core-hr/resignations',
    '/core-hr/terminations',
    '/core-hr/complaints',
    '/core-hr/travel',
    '/organization/departments',
    '/organization/designations',
    '/organization/locations',
    '/organization/user-linking',
    '/organization/chart',
    '/organization/settings',
    '/payroll',
    `/payroll/${fixtures.payrollRunId}`,
    `/payroll/slip/${fixtures.slipId}`,
    '/reports',
    '/reports/attendance',
    '/reports/payroll',
    '/reports/tax',
    '/super-admin',
  ];
}

function buildAllow(routes, fixtures) {
  return {
    super_admin: new Set(routes),
    admin: new Set(routes.filter((r) => r !== '/super-admin')),
    manager: new Set([
      '/dashboard',
      '/profile',
      '/leave-requests',
      '/attendance',
      '/attendance/team',
      '/employees',
      `/employees/${fixtures.employeeId}`,
      '/recruitment/jobs',
      '/recruitment/jobs/new',
      '/recruitment/board',
      '/training/catalog',
      '/training/my-learning',
      '/training/courses/new',
      `/payroll/slip/${fixtures.slipId}`,
    ]),
    employee: new Set([
      '/dashboard',
      '/profile',
      '/leave-requests',
      '/attendance',
      '/training/catalog',
      '/training/my-learning',
      `/payroll/slip/${fixtures.slipId}`,
    ]),
  };
}

function stripUrl(url) {
  return url.replace(BASE_URL, '');
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(250);
  await page.locator('.animate-spin').first().waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
}

async function waitForReadySignal(page) {
  const readyCandidates = [
    page.locator('main'),
    page.locator('h1').first(),
    page.locator('table'),
    page.locator('text=No data available'),
    page.locator('text=No notifications yet'),
  ];
  for (const c of readyCandidates) {
    if ((await c.count()) > 0) {
      await c.first().waitFor({ state: 'visible', timeout: 1800 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function gotoReady(page, routePath) {
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const ready = await waitForReadySignal(page);
  return { finalPath: stripUrl(page.url()), ready };
}

async function waitForDeniedRedirect(page, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const p = stripUrl(page.url());
    if (p === '/dashboard' || p === '/auth/login') {
      return p;
    }
    await page.waitForTimeout(250);
  }
  return stripUrl(page.url());
}

async function logout(page) {
  const signOut = page.getByRole('button', { name: /sign out/i });
  if ((await signOut.count()) > 0) {
    await signOut.first().click({ timeout: 2000 }).catch(() => {});
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

async function resolveFixtures(page) {
  const resolved = { ...FIXTURES };

  await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const employeeId = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((el) => el.getAttribute('href') || '');
    const match = links.find((href) => /^\/employees\/[a-z0-9]+$/i.test(href));
    return match ? match.split('/').pop() : null;
  });
  if (employeeId) {
    resolved.employeeId = employeeId;
  }

  await page.goto(`${BASE_URL}/payroll`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const payrollRunId = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((el) => el.getAttribute('href') || '');
    const match = links.find((href) => /^\/payroll\/[a-z0-9]+$/i.test(href));
    return match ? match.split('/').pop() : null;
  });
  if (payrollRunId) {
    resolved.payrollRunId = payrollRunId;
  }

  if (resolved.payrollRunId) {
    await page.goto(`${BASE_URL}/payroll/${resolved.payrollRunId}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const slipId = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((el) => el.getAttribute('href') || '');
      const match = links.find((href) => /^\/payroll\/slip\/[a-z0-9]+$/i.test(href));
      return match ? match.split('/').pop() : null;
    });
    if (slipId) {
      resolved.slipId = slipId;
    }
  }

  return resolved;
}

async function resolveEmployeeSlipFixture(page) {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  return await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'))
      .map((el) => el.getAttribute('href') || '');
    const match = links.find((href) => /^\/payroll\/slip\/[a-z0-9]+$/i.test(href));
    return match ? match.split('/').pop() : null;
  });
}

function expectedAllowed(allow, fixtures, roleKey, routePath) {
  if (allow[roleKey].has(routePath)) return true;
  if (routePath.startsWith('/employees/') && allow[roleKey].has('/employees')) return true;
  if (routePath.startsWith('/payroll/slip/')) return allow[roleKey].has(`/payroll/slip/${fixtures.slipId}`);
  if (routePath.startsWith('/payroll/') && !routePath.startsWith('/payroll/slip/')) return allow[roleKey].has('/payroll');
  return false;
}

function didPass(expected, finalPath, routePath) {
  if (!expected) return finalPath === '/dashboard';
  if (routePath.startsWith('/employees/')) return finalPath.startsWith('/employees/');
  if (routePath.startsWith('/payroll/slip/')) return finalPath.startsWith('/payroll/slip/');
  if (routePath.startsWith('/payroll/')) return finalPath.startsWith('/payroll/');
  return finalPath === routePath || finalPath.startsWith(`${routePath}/`);
}

function collectRecommendations(results, consoleFindings) {
  const recommendations = [];
  if (results.some((r) => r.passed === false)) {
    recommendations.push('Fix all FAIL route checks before release; each denied/allowed mismatch is a security/UX risk.');
  }
  if (consoleFindings.some((f) => f.type === 'icon_missing')) {
    recommendations.push('Add missing SVG icon assets or map icon names to existing assets to remove runtime icon failures.');
  }
  if (consoleFindings.some((f) => f.type === 'ng0955')) {
    recommendations.push('Resolve remaining NG0955 duplicate-track warnings (likely non-table @for loops still tracking non-unique keys).');
  }
  return recommendations;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleFindings = [];
  page.on('console', (msg) => {
    const text = msg.text() || '';
    if (text.includes('NG0955')) {
      consoleFindings.push({ type: 'ng0955', text });
    }
    if (text.includes('Icon not found:')) {
      consoleFindings.push({ type: 'icon_missing', text });
    }
  });
  page.on('dialog', async (d) => {
    await d.accept().catch(() => {});
  });

  await login(page, roles[0].email);
  const fixtures = await resolveFixtures(page);
  await logout(page);

  await login(page, 'employee@aurumtest.local');
  const employeeSlipId = await resolveEmployeeSlipFixture(page);
  if (employeeSlipId) {
    fixtures.slipId = employeeSlipId;
  }
  await logout(page);

  const routes = buildRoutes(fixtures);
  const allow = buildAllow(routes, fixtures);

  const audit = {
    generatedAt: new Date().toISOString(),
    fixtures,
    roles: {},
    summary: {},
  };

  for (const role of roles) {
    await login(page, role.email);
    const nav = (await page.locator('nav a').allInnerTexts())
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    const routeChecks = [];
    for (const routePath of routes) {
      const expected = expectedAllowed(allow, fixtures, role.key, routePath);
      let { finalPath, ready } = await gotoReady(page, routePath);

      if (!expected && finalPath !== '/dashboard' && finalPath !== '/auth/login') {
        finalPath = await waitForDeniedRedirect(page);
        ready = false;
      }

      const passed = didPass(expected, finalPath, routePath);
      routeChecks.push({
        route: routePath,
        expectedAllowed: expected,
        finalPath,
        ready,
        passed,
      });
    }

    let payData = {
      employeeDetailReachable: false,
      compensationTabVisible: false,
      compensationEditVisible: false,
    };

    if (role.key !== 'employee') {
      const det = await gotoReady(page, `/employees/${fixtures.employeeId}`);
      if (det.finalPath.startsWith('/employees/')) {
        payData.employeeDetailReachable = true;
        await page.getByRole('button', { name: /overview/i }).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
        const compTab = page.getByRole('button', { name: /^compensation$/i });
        const compTabAlt = page.locator('button:has-text("Compensation"), button:has-text("compensation")');
        payData.compensationTabVisible = (await compTab.count()) > 0 || (await compTabAlt.count()) > 0;
        if (payData.compensationTabVisible) {
          if ((await compTab.count()) > 0) {
            await compTab.first().click().catch(() => {});
          } else {
            await compTabAlt.first().click().catch(() => {});
          }
          await settle(page);
          payData.compensationEditVisible = (await page.getByRole('button', { name: /^edit$/i }).count()) > 0;
        }
      }
    }

    audit.roles[role.key] = {
      nav,
      routeChecks,
      payData,
    };

    await logout(page);
  }

  const flattened = Object.entries(audit.roles).flatMap(([role, data]) =>
    data.routeChecks.map((r) => ({ role, ...r }))
  );
  const total = flattened.length;
  const passed = flattened.filter((r) => r.passed).length;
  const failed = flattened.filter((r) => !r.passed);
  const recommendations = collectRecommendations(flattened, consoleFindings);

  audit.summary = {
    totalChecks: total,
    passedChecks: passed,
    failedChecks: failed.length,
    failures: failed.slice(0, 200),
    consoleFindings: {
      ng0955Count: consoleFindings.filter((f) => f.type === 'ng0955').length,
      iconMissingCount: consoleFindings.filter((f) => f.type === 'icon_missing').length,
    },
    recommendations,
  };

  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'ROLE-ROUTE-AUDIT.json');
  fs.writeFileSync(jsonPath, JSON.stringify(audit, null, 2));

  const lines = [];
  lines.push('# Role Route Audit Checklist');
  lines.push('');
  lines.push(`Generated: ${audit.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Total checks: ${audit.summary.totalChecks}`);
  lines.push(`- Passed: ${audit.summary.passedChecks}`);
  lines.push(`- Failed: ${audit.summary.failedChecks}`);
  lines.push(`- NG0955 warnings: ${audit.summary.consoleFindings.ng0955Count}`);
  lines.push(`- Missing icon warnings: ${audit.summary.consoleFindings.iconMissingCount}`);
  lines.push('');

  for (const role of roles) {
    const roleData = audit.roles[role.key];
    lines.push(`## ${role.key}`);
    lines.push(`- Nav items: ${roleData.nav.join(', ')}`);
    lines.push(`- Pay data: reachable=${roleData.payData.employeeDetailReachable}, compensationTab=${roleData.payData.compensationTabVisible}, editVisible=${roleData.payData.compensationEditVisible}`);
    const failures = roleData.routeChecks.filter((c) => !c.passed);
    lines.push(`- Route checks: ${roleData.routeChecks.length}, failures=${failures.length}`);
    for (const f of failures.slice(0, 50)) {
      lines.push(`- FAIL ${f.route} -> ${f.finalPath} (expectedAllowed=${f.expectedAllowed}, ready=${f.ready})`);
    }
    lines.push('');
  }

  lines.push('## Recommendations');
  if (recommendations.length === 0) {
    lines.push('- No additional recommendations.');
  } else {
    for (const rec of recommendations) lines.push(`- ${rec}`);
  }
  lines.push('');
  lines.push(`Raw JSON: \`docs/ROLE-ROUTE-AUDIT.json\``);

  const mdPath = path.join(outDir, 'ROLE-ROUTE-AUDIT-CHECKLIST.md');
  fs.writeFileSync(mdPath, lines.join('\n'));

  await browser.close();
  return { jsonPath, mdPath, totalChecks: total, failedChecks: failed.length };
}

run()
  .then((res) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
