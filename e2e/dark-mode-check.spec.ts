import { test, expect } from '@playwright/test';

test('Dark Mode Verification', async ({ page }) => {
  await page.goto('/auth/login');
  
  // Login first as theme might be user-preference saved or local storage
  await page.fill('input[type="email"]', 'admin@aurumtest.local');
  await page.fill('input[type="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');

  // Check initial state
  const html = page.locator('html');
  const initialClass = await html.getAttribute('class') || '';
  console.log('Initial HTML class:', initialClass);

  // Toggle Dark Mode
  // Use the selector we found earlier or a more generic one
  const toggleBtn = page.locator('button[title="Switch to Dark Mode"], button[title="Switch to Light Mode"]');
  await expect(toggleBtn.first()).toBeVisible();
  
  // Click to toggle
  await toggleBtn.first().click();
  await page.waitForTimeout(1000); // Wait for transition
  
  const toggledClass = await html.getAttribute('class') || '';
  console.log('Toggled HTML class:', toggledClass);
  
  // Verify it changed
  if (initialClass.includes('dark')) {
      expect(toggledClass).not.toContain('dark');
  } else {
      expect(toggledClass).toContain('dark');
  }
  
  // Take screenshot in confirmed dark mode
  await page.screenshot({ path: 'e2e/screenshots/dark-mode-confirmed.png' });
});
