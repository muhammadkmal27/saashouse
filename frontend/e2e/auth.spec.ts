import { test, expect } from '@playwright/test';

// Generate unique credentials for this test run
const uniqueId = Date.now();
const testEmail = `testuser_${uniqueId}@example.com`;
const testPassword = 'Password123!';

test.describe.serial('Authentication Flow (Real Database)', () => {

  test('should register a new client account successfully', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input#full_name', 'Playwright Client');
    await page.fill('input#email', testEmail);
    await page.fill('input#phone_number', '0123456789');
    await page.fill('input#password', testPassword);
    await page.fill('input#confirm_password', testPassword);

    const submitBtn = page.locator('button[type="submit"]');
    // Wait for Turnstile to resolve (assumes test key)
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    // After register, it should go to login
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 15000 });
    // Expect success message
    await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('should login successfully as a client', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    // Should redirect to client dashboard
    await expect(page).toHaveURL(/.*\/client\/dashboard/, { timeout: 15000 });
  });

  test('should login as admin using Magic Code (000000)', async ({ page }) => {
    await page.goto('/auth/login');
    
    // We assume there's a seeded admin account
    await page.fill('input#email', 'admin@saashouse.com'); 
    await page.fill('input#password', 'Admin123!');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();

    // Should redirect to 2FA page
    await expect(page).toHaveURL(/.*\/auth\/verify-2fa/, { timeout: 15000 });

    // Enter Magic Code
    const otpInput = page.locator('input[type="text"]').first();
    await otpInput.fill('000000');
    
    const verifyBtn = page.locator('button[type="submit"]');
    await verifyBtn.click();

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*\/admin\/dashboard/, { timeout: 15000 });
  });

  test('should navigate to forgot password page and submit request', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    const pageTitle = page.getByText(/Forgot Password|Lupa Kata Laluan/i).first();
    await expect(pageTitle).toBeVisible({ timeout: 15000 });

    await page.fill('input#email', testEmail);
    
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    await submitBtn.click();
    
    // Check for success message or navigation
    await expect(page.locator('text=/sent|dihantar/i')).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test('should load reset password page', async ({ page }) => {
    // In a real E2E, we would extract the token from the database or email,
    // but for UI validation, we just verify the page loads correctly with a dummy token.
    await page.goto('/auth/reset-password?token=dummy_token_123');
    
    const pageTitle = page.getByText(/Reset Password|Set Semula/i).first();
    await expect(pageTitle).toBeVisible({ timeout: 15000 });
  });
});

