import { test, expect } from '@playwright/test';

test('Employee Dashboard Verification', async ({ page }) => {
  // Login as employee
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'employee@aurumtest.local');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard');
  
  // Verify Employee specific elements
  // Employees usually see "My Attendance" or similar, maybe different widgets
  await expect(page.getByRole('heading', { name: /Dashboard|Welcome/ })).toBeVisible();
  
  // Check if they have restricted access (e.g. should NOT see "Employees" or "Departments" in sidebar if they are just standard employees, 
  // though the menu might just be filtered)
  // Based on login.component.html/main-layout, the menu items are guarded by @if (canManageEmployees())
  
  // Let's take a screenshot
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/employee-dashboard.png' });
});
