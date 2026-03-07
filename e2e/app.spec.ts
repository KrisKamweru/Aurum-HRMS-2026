import { expect, test } from '@playwright/test';

test('renders the Aurum reset baseline shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Aurum HRMS' })).toBeVisible();
  await expect(page.getByText('Fresh Reset Baseline')).toBeVisible();
  await expect(page.getByText('Tailwind 4')).toBeVisible();
});
