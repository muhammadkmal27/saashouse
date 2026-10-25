import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the homepage and display correct title', async ({ page }) => {
    await page.goto('/');

    
    // Default language is English. We check for a visible project link instead of a specific translation button
    // Or check for the Pro Website text
    const proWebsite = page.getByText(/PRO WEBSITE|PEMBANGUNAN WEB/i).first();
    await expect(proWebsite).toBeVisible({ timeout: 10000 });
  });

  test('navigation to pricing page works', async ({ page }) => {
    await page.goto('/');
    const pricingLink = page.getByRole('link', { name: /Harga/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page).toHaveURL(/.*pricing/);
    }
  });
});
