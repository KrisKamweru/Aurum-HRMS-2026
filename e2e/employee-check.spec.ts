import { test, expect } from '@playwright/test';

test('Employee Dashboard Verification', async ({ page }) => {
  // Login as employee
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'employee@aurumtest.local');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard');

  // Verify dashboard shell is loaded for employee role.
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('link', { name: /employees/i })).toHaveCount(0);
  
  // Let's take a screenshot
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/employee-dashboard.png' });
});
