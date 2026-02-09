import { expect, test } from '@playwright/test';

const PASSWORD = 'TestPass123!';
const EMPLOYEE_ID = 'k5757svk6tb26z2r65safesgf17zcj8x';

async function login(page: any, email: string) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

async function openCompensationTab(page: any) {
  await page.goto(`/employees/${EMPLOYEE_ID}`);
  await page.getByRole('button', { name: /^compensation$/i }).click();
  await expect(page.locator('ui-grid-tile:has-text("Compensation Details")')).toBeVisible();
}

async function submitReasonDialog(page: any, reason: string, confirmText = 'Submit') {
  await expect(page.locator('#confirm-reason')).toBeVisible();
  await page.locator('#confirm-reason').fill(reason);
  await page.getByRole('button', { name: new RegExp(`^${confirmText}$`, 'i') }).click();
}

test.describe('Compensation + Financial Role Regression', () => {
  test('admin can open/edit/cancel and submit compensation change', async ({ page }) => {
    await login(page, 'admin@aurumtest.local');
    await openCompensationTab(page);

    const editButton = page.getByRole('button', { name: /^edit$/i });
    await expect(editButton).toBeVisible();

    await editButton.click();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();

    await page.locator('form').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('button', { name: /^edit$/i })).toBeVisible();

    await page.getByRole('button', { name: /^edit$/i }).click();
    await page.locator('input[formcontrolname="baseSalary"]').fill('91000');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await submitReasonDialog(page, 'Quarterly compensation review adjustment');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0, { timeout: 10000 });
  });

  test('manager can view compensation but cannot edit financial controls', async ({ page }) => {
    await login(page, 'manager@aurumtest.local');
    await openCompensationTab(page);

    await expect(page.getByRole('button', { name: /^edit$/i })).toHaveCount(0);

    await page.getByRole('button', { name: /^financial$/i }).click();
    await expect(page.locator('ui-grid-tile:has-text("Allowances") button:has-text("Add")')).toHaveCount(0);
    await expect(page.locator('ui-grid-tile:has-text("Deductions") button:has-text("Add")')).toHaveCount(0);
  });

  test('manager can deny a pending compensation request via protected mutation path', async ({ page }) => {
    await login(page, 'admin@aurumtest.local');
    await openCompensationTab(page);
    await page.getByRole('button', { name: /^edit$/i }).click();
    await page.locator('input[formcontrolname="baseSalary"]').fill('92000');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await submitReasonDialog(page, 'Create pending request for deny-path regression');
    await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0, { timeout: 10000 });

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();

    await login(page, 'manager@aurumtest.local');
    const reviewResult = await page.evaluate(async ({ employeeId }) => {
      try {
        const pending = await (window as any).__aurumConvexClient.query(
          (window as any).__aurumApi.payroll.listPendingSensitiveChanges,
          {}
        );
        const target = pending.find(
          (req: any) => req.targetTable === 'employees' && req.targetId === employeeId && req.status === 'pending'
        );
        if (!target) {
          return { ok: false, message: 'No pending compensation request found for deny path' };
        }
        await (window as any).__aurumConvexClient.mutation(
          (window as any).__aurumApi.payroll.reviewSensitiveChange,
          {
            changeRequestId: target._id,
            decision: 'rejected',
            rejectionReason: 'Denied in compensation regression',
          }
        );
        const after = await (window as any).__aurumConvexClient.query(
          (window as any).__aurumApi.payroll.listPendingSensitiveChanges,
          {}
        );
        const stillPending = after.some((req: any) => req._id === target._id);
        return { ok: true, stillPending };
      } catch (error: any) {
        return { ok: false, message: String(error?.message || error) };
      }
    }, { employeeId: EMPLOYEE_ID });

    expect(reviewResult.ok).toBe(true);
    expect(reviewResult.stillPending).toBe(false);
  });
});
