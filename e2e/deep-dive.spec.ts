import { test, expect } from '@playwright/test';

test.describe('Aurum HRMS Deep Dive', () => {
  const email = 'admin@aurumtest.local';
  const password = 'TestPass123!';

  test('Advanced Navigation and Modals', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 1. Team Attendance Direct Access
    console.log('Test: Team Attendance Page');
    await page.goto('/attendance/team');
    // Expect some header related to Team Attendance
    await expect(page.getByRole('heading', { name: /Team Attendance|Team Overview/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/10-team-attendance-page.png' });
    console.log('Status: PASS');

    // 2. Organization: Designations
    console.log('Test: Organization - Designations');
    await page.goto('/organization/designations');
    await expect(page.getByRole('heading', { name: /Designations/i })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/11-designations.png' });
    console.log('Status: PASS');

    // 3. Core HR: Promotions
    console.log('Test: Core HR - Promotions');
    await page.goto('/core-hr/promotions');
    await expect(page.getByRole('heading', { name: /Promotions/i })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/12-promotions.png' });
    console.log('Status: PASS');

    // 4. Modal Interaction: Request Leave
    console.log('Test: Request Leave Modal');
    await page.goto('/leave-requests');
    // Find the "Request Leave" or "New Request" button
    const requestBtn = page.getByRole('button', { name: /Request Leave|New Request/i }).first();
    
    if (await requestBtn.isVisible()) {
        await requestBtn.click();
        // Wait for modal
        const modal = page.locator('ui-modal, dialog, .modal-container, div[role="dialog"]');
        await expect(modal.first()).toBeVisible();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/13-leave-modal.png' });
        console.log('Status: PASS');
        
        // Close modal (escape or click outside/close button) - Optional, just ending test here is fine
    } else {
        console.log('Warning: Request Leave button not found');
    }
  });
});
