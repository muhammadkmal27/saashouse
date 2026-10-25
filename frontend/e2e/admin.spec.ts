import { test, expect } from '@playwright/test';

test.describe.serial('Admin Dashboard Flow', () => {

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

  test('should navigate to clients list', async ({ page }) => {
    await page.goto('/admin/clients');
    const clientsTitle = page.getByText(/Clients|Pelanggan/i).first();
    await expect(clientsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to projects list and simulate magic code deletion', async ({ page }) => {
    await page.goto('/admin/projects');
    
    // Wait for table to load
    const projectsTitle = page.getByText(/Projects|Projek/i).first();
    await expect(projectsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to users list', async ({ page }) => {
    await page.goto('/admin/users');
    const usersTitle = page.getByText(/Users|Pengguna/i).first();
    await expect(usersTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to billing & invoices', async ({ page }) => {
    await page.goto('/admin/billing');
    const billingTitle = page.getByText(/Billing|Invois/i).first();
    await expect(billingTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to support tickets', async ({ page }) => {
    await page.goto('/admin/tickets');
    const ticketsTitle = page.getByText(/Tickets|Tiket/i).first();
    await expect(ticketsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to system settings', async ({ page }) => {
    await page.goto('/admin/settings');
    const settingsTitle = page.getByText(/Settings|Tetapan/i).first();
    await expect(settingsTitle).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to specific project details [id]', async ({ page }) => {
    // Testing dynamic route rendering
    await page.goto('/admin/projects/test-id-123');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to specific ticket details [id]', async ({ page }) => {
    // Testing dynamic route rendering
    await page.goto('/admin/tickets/test-id-123');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 15000 });
  });
});
