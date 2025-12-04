import { test, expect } from '@playwright/test';

test('practice page loads and contains Pratiquer heading', async ({ page }) => {
  await page.goto('/practice');
  await expect(page.locator('h1')).toContainText('Pratiquer');
});
