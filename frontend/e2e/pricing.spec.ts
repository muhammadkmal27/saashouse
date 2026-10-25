import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test('should load the pricing page properly', async ({ page }) => {
    await page.goto('/pricing');
    
    // Default language is English.
    const headingText = page.getByText(/One-Time Purchase|Transparent SaaS Model/i).first();
    await expect(headingText).toBeVisible({ timeout: 15000 });
  });

  test('should open FAQ item when clicked', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check FAQ Section
    const faqTitle = page.getByText(/Frequently Asked Questions|Soalan Lazim/i).first();
    await expect(faqTitle).toBeVisible();

    // Click on the first FAQ question using chevron button or question text
    const faqButton = page.locator('button.group').first();
    if (await faqButton.isVisible()) {
      await faqButton.click();
      
      // Check if the answer panel is now open (max-h-96 class is added)
      await expect(faqButton.locator('..').locator('div.overflow-hidden')).toHaveClass(/max-h-96/);
    }
  });
});
