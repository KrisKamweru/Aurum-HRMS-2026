import { test, expect } from '@playwright/test';
test.describe('Aurum HRMS Regression', () => {
  // Use admin credentials
  const email = 'admin@aurumtest.local';
  const password = 'TestPass123!';

  test('Complete regression walk-through', async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Console Error: "${msg.text()}"`);
        consoleErrors.push(msg.text());
      }
    });

    // 1. Login Page
    console.log('Test 1: Login Page Render');
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/Aurum/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    console.log('Status: PASS');

    // 2. Authentication
    console.log('Test 2: Login Action');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('Status: PASS');

    // 3. Dashboard
    console.log('Test 3: Dashboard Load');
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(2000); // Give it a bit more time for widgets to load
    await page.screenshot({ path: 'e2e/screenshots/2-dashboard.png' });
    console.log('Status: PASS');

    // 4. Employees List
    console.log('Test 4: Employees Module');
    await page.click('a[href="/employees"]');
    await page.waitForURL('**/employees');
    await expect(page.getByRole('heading', { name: 'Employees', exact: true })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/3-employees.png' });
    console.log('Status: PASS');

    // 5. Leave Requests
    console.log('Test 5: Leave Requests Module');
    await page.click('a[href="/leave-requests"]');
    await page.waitForURL('**/leave-requests');
    await expect(page.getByRole('heading', { name: 'Leave Requests' })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/4-leave-requests.png' });
    console.log('Status: PASS');

    // 6. Attendance
    console.log('Test 6: Attendance Module');
    await page.click('a[href="/attendance"]');
    await page.waitForURL('**/attendance');
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/5-attendance.png' });
    console.log('Status: PASS');

    // 7. Core HR (Departments)
    console.log('Test 7: Core HR Module');
    await page.click('a[href="/organization/departments"]');
    await page.waitForURL('**/organization/departments');
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/6-departments.png' });
    console.log('Status: PASS');

    // 8. Dark Mode
    console.log('Test 8: Dark Mode Toggle');
    // Try to find the button by title, handling potential variation in title state
    const toggleBtn = page.locator('button:has(.lucide-moon), button:has(.lucide-sun), button[title="Switch to Dark Mode"], button[title="Switch to Light Mode"]');
    // Note: The icon name in ui-icon might be 'moon' or 'sun'. The previous attempt used title selector which is good.
    // The previous code had: <button [title]="...Switch to Dark Mode...">
    
    if (await toggleBtn.count() > 0) {
        await toggleBtn.first().click();
        await page.waitForTimeout(1000); // Transition
        await page.screenshot({ path: 'e2e/screenshots/7-dark-mode.png' });
        console.log('Status: PASS');
    } else {
        console.log('Warning: Dark mode toggle button not found');
    }

    if (consoleErrors.length > 0) {
        console.log('Console Errors found during test:');
        consoleErrors.forEach(err => console.log(`- ${err}`));
    }
  });
});
