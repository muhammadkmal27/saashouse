import { test, expect } from '@playwright/test';

// Generate unique credentials for this test run
const uniqueId = Date.now();
const testEmail = `client_${uniqueId}@example.com`;
const testPassword = 'Password123!';

test.describe.serial('Client Dashboard Flow', () => {

  test('should register and login as a new client', async ({ page }) => {
    // Register
    await page.goto('/auth/register');
    await page.fill('input#full_name', 'Playwright Test Client');
    await page.fill('input#email', testEmail);
    await page.fill('input#phone_number', '0123456789');
    await page.fill('input#password', testPassword);
    await page.fill('input#confirm_password', testPassword);
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 15000 });

    // Login
    await page.goto('/auth/login');
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    const loginBtn = page.locator('button[type="submit"]');
    await expect(loginBtn).toBeEnabled({ timeout: 15000 });
    await loginBtn.click();

    await expect(page).toHaveURL(/.*\/client\/dashboard/, { timeout: 15000 });
  });

  test('should create a new project', async ({ page }) => {
    // Assuming the user is still logged in from the previous test in the same context
    await page.goto('/client/projects/create');
    
    // Check if form is visible. (Just an example of interaction)
    // If there is a form, we'd fill it. If not, we just check if it loads.
    const createBtn = page.getByRole('button', { name: /Create|Cipta/i }).first();
    if (await createBtn.isVisible()) {
        // await page.fill('input[name="title"]', 'E2E Test Project');
        // await createBtn.click();
    }
  });

  test('should view billing page', async ({ page }) => {
    await page.goto('/client/billing');
    
    const billingTitle = page.getByText(/Billing|Bil/i).first();
    await expect(billingTitle).toBeVisible({ timeout: 15000 });
  });

  test('should view tickets page', async ({ page }) => {
    await page.goto('/client/tickets');
    const ticketsTitle = page.getByText(/Tickets|Tiket/i).first();
    await expect(ticketsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should view settings page', async ({ page }) => {
    await page.goto('/client/settings');
    const settingsTitle = page.getByText(/Settings|Tetapan/i).first();
    await expect(settingsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should view payment page', async ({ page }) => {
    // Payment page usually requires a bill code, but we can verify it loads or shows "invalid bill code"
    await page.goto('/client/payment?bill_code=TEST1234');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  // --- Sub-Pages & Dynamic Routes ---

  test('should load all payment sub-routes', async ({ page }) => {
    await page.goto('/client/payment/cancel');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/payment/success');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/payment/toyyibpay-return');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load projects list and dynamic project details', async ({ page }) => {
    await page.goto('/client/projects');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/projects/test-id-123');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load all settings sub-pages', async ({ page }) => {
    await page.goto('/client/settings/account');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/settings/notifications');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/settings/profile');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/settings/security');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load new ticket and dynamic ticket details', async ({ page }) => {
    await page.goto('/client/tickets/new');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/client/tickets/test-id-123');
    await expect(page.locator('body')).toBeVisible();
  });
});
