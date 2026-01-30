import { test, expect } from '@playwright/test';

test('Employee Attendance Clock-In/Out Flow', async ({ page }) => {
  // Login as employee
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'employee@aurumtest.local');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Locate the Time Clock widget
  const clockWidget = page.locator('app-time-clock-widget, .time-clock-widget, ui-card:has-text("Time Clock")').first();
  await expect(clockWidget).toBeVisible();

  // Check current status
  // Possibilities:
  // 1. Not clocked in (Button: Clock In)
  // 2. Clocked In (Button: Clock Out)
  // 3. Clocked Out / Done for day (Text: You've completed today's shift)

  const clockInBtn = clockWidget.getByRole('button', { name: /Clock In/i });
  const clockOutBtn = clockWidget.getByRole('button', { name: /Clock Out/i });
  const completedText = clockWidget.getByText("You've completed today's shift");

  if (await completedText.isVisible()) {
    console.log('User has already completed shift for today. Cannot test clock flow.');
    return; // Pass gracefully
  }

  if (await clockInBtn.isVisible()) {
    console.log('State: Not Clocked In. Action: Clocking In...');
    await clockInBtn.click();
    
    // Expect Clock Out button to appear
    await expect(clockOutBtn).toBeVisible({ timeout: 10000 });
    console.log('Success: Clocked In. Button changed to Clock Out.');
    await page.screenshot({ path: 'e2e/screenshots/attendance-clocked-in.png' });
    
    // Now we can test Clock Out
    console.log('Action: Clocking Out...');
    await clockOutBtn.click();
    
    // Expect completion message
    await expect(completedText).toBeVisible({ timeout: 10000 });
    console.log('Success: Clocked Out. Completion message visible.');
    await page.screenshot({ path: 'e2e/screenshots/attendance-completed.png' });
    
  } else if (await clockOutBtn.isVisible()) {
    console.log('State: Already Clocked In. Action: Clocking Out...');
    await clockOutBtn.click();
    
    // Expect completion message
    await expect(completedText).toBeVisible({ timeout: 10000 });
    console.log('Success: Clocked Out. Completion message visible.');
    await page.screenshot({ path: 'e2e/screenshots/attendance-completed.png' });
  }
});
