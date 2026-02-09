import { expect, test } from '@playwright/test';

const PASSWORD = 'TestPass123!';
const EMPLOYEE_ID = 'k5757svk6tb26z2r65safesgf17zcj8x';
const RUN_ID = 'pn778np8eetvrkcayp681yj62n807ydx';

async function login(page: any, email: string) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

test.describe('Negative Authorization Mutation Checks', () => {
  test('manager cannot update compensation directly', async ({ page }) => {
    await login(page, 'manager@aurumtest.local');

    const result = await page.evaluate(async ({ employeeId }) => {
      try {
        await (window as any).__aurumConvexClient.mutation(
          (window as any).__aurumApi.employees.updateCompensation,
          {
            employeeId,
            baseSalary: 123456,
            currency: 'USD',
            payFrequency: 'monthly',
            reason: 'Unauthorized mutation check',
          }
        );
        return { ok: true };
      } catch (error: any) {
        return { ok: false, message: String(error?.message || error) };
      }
    }, { employeeId: EMPLOYEE_ID });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/unauthorized/i);
  });

  test('employee cannot request payroll finalization directly', async ({ page }) => {
    await login(page, 'employee@aurumtest.local');

    const result = await page.evaluate(async ({ runId }) => {
      try {
        await (window as any).__aurumConvexClient.mutation(
          (window as any).__aurumApi.payroll.finalizeRun,
          {
            runId,
            reason: 'Unauthorized mutation check',
          }
        );
        return { ok: true };
      } catch (error: any) {
        return { ok: false, message: String(error?.message || error) };
      }
    }, { runId: RUN_ID });

    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/unauthorized/i);
  });
});
