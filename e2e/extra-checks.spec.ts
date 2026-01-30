import { test, expect } from '@playwright/test';

test.describe('Aurum HRMS Extra Visual Checks', () => {
  const email = 'admin@aurumtest.local';
  const password = 'TestPass123!';

  test('Profile and Team Attendance', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 1. Profile
    console.log('Checking Profile...');
    // Usually clicking the user avatar or "View Profile" link
    // Based on sidebar code: routerLink="/profile"
    await page.click('a[href="/profile"]');
    await page.waitForURL('**/profile');
    await expect(page.getByRole('heading', { name: /Profile|User/i })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/8-profile.png' });
    console.log('Profile: PASS');

    // 2. Team Attendance (Admin only typically)
    console.log('Checking Team Attendance...');
    // Navigate to attendance first
    await page.goto('/attendance');
    // Look for "Team View" button or tab if it exists, or just verify the attendance page structure
    // In attendance.component.ts (inferred), there might be a Team View
    // Let's just screenshot the main attendance page again but look for specific admin controls
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    
    // Try to find a "Team View" button if it exists
    const teamViewBtn = page.getByRole('button', { name: /Team View/i });
    if (await teamViewBtn.isVisible()) {
        await teamViewBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/9-team-attendance.png' });
        console.log('Team Attendance: PASS');
    } else {
        console.log('Team Attendance button not found or not accessible');
    }
  });
});
