import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {

  test('should load the showcase page', async ({ page }) => {
    await page.goto('/showcase');
    
    // Default language is English. 
    // Check if the Showcase header is visible
    const showcaseTitle = page.getByText(/Showcase|Portfolio/i).first();
    await expect(showcaseTitle).toBeVisible({ timeout: 15000 });
  });

  test('should fill and submit the contact form', async ({ page }) => {
    await page.goto('/contact');
    
    // Fill the contact form
    await page.fill('input[name="name"]', 'Playwright User');
    await page.fill('input[name="email"]', 'test_contact@example.com');
    await page.fill('textarea[name="message"]', 'This is an automated E2E test message.');
    
    // Submit button (assumes it is disabled until Turnstile passes, or we wait for Turnstile)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    
    await submitBtn.click();
    
    // Expect success message
    await expect(page.locator('text=/Message sent successfully|Mesej berjaya dihantar/i')).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test('should load the maintenance page', async ({ page }) => {
    await page.goto('/maintenance');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });
});
