import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage, DriversPage, DriverFormModal, ReportsPage, Navigation } from "./pages";
import { testConfig, generateTestData, validateTestEnv } from "./setup/test-env";

/**
 * E2E Test Suite: Complete User Journey
 *
 * Uses Page Object Model pattern for maintainable tests
 * Tests critical user flow from authentication to CRUD operations
 *
 * Required for MVP acceptance criteria:
 * - Authentication mechanism ✅
 * - CRUD operations ✅
 * - Business logic verification ✅
 */

// Validate test environment before running tests
test.beforeAll(() => {
  validateTestEnv();
});

// Setup: Use browser context for test isolation
test.use({
  viewport: { width: 1280, height: 720 },
});

test.describe("Complete User Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts fresh
    await page.goto("/");
  });

  test("should complete full user flow: Login → Dashboard → Drivers CRUD → Reports", async ({ page }) => {
    // ============================================
    // STEP 1: Authentication (Login)
    // ============================================

    const loginPage = new LoginPage(page);

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/signin/);

    // Fill and submit login form
    console.log(`Logging in with: ${testConfig.testEmail}`);
    await loginPage.login(testConfig.testEmail, testConfig.testPassword);

    // ============================================
    // STEP 2: Dashboard Access (Auth Success)
    // ============================================

    const dashboard = new DashboardPage(page);

    // Wait for redirect and dashboard load
    console.log("Waiting for dashboard redirect...");
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    console.log(`Current URL: ${page.url()}`);

    // Debug: Take screenshot before waiting
    await page.screenshot({ path: "test-results/debug-before-dashboard-load.png", fullPage: true });

    // Debug: Log page content
    const pageContent = await page.content();
    console.log(`Page title: ${await page.title()}`);
    console.log(`Page contains "Dashboard": ${pageContent.includes("Dashboard")}`);
    console.log(`Page contains "Dzisiaj": ${pageContent.includes("Dzisiaj")}`);

    await dashboard.waitForLoad();

    // Verify dashboard elements
    await expect(dashboard.pageTitle).toBeVisible();

    // ============================================
    // STEP 3: Navigation to Drivers (Read)
    // ============================================

    const navigation = new Navigation(page);
    const driversPage = new DriversPage(page);

    // Navigate to drivers
    console.log("Navigating to drivers...");
    await navigation.goToDrivers();
    await driversPage.waitForLoad();

    // Verify page loaded
    await expect(driversPage.pageTitle).toBeVisible();
    expect(await driversPage.hasDrivers()).toBeTruthy();

    // ============================================
    // STEP 4: Create Driver (CRUD: Create)
    // ============================================

    const driverForm = new DriverFormModal(page);

    // Open driver form
    await driversPage.clickAddDriver();
    await driverForm.waitForOpen();

    // Generate unique test data
    const testData = generateTestData();
    const driverData = testData.driver;

    // Fill and submit form
    await driverForm.fillForm(driverData);
    await driverForm.submit();

    // Wait for modal to close (success)
    await driverForm.waitForClose();

    // Small delay for optimistic update
    await page.waitForTimeout(1000);

    // ============================================
    // STEP 5: Verify Driver Created (CRUD: Read)
    // ============================================

    // Search for newly created driver
    await driversPage.searchDriver(driverData.name);

    // Verify driver appears in list
    const driverRow = driversPage.getDriverRow(driverData.name);
    await expect(driverRow).toBeVisible({ timeout: 5000 });

    // Verify email is also visible
    const emailLocator = page.locator(`text="${driverData.email}"`);
    await expect(emailLocator).toBeVisible();

    // ============================================
    // STEP 6: Navigate to Reports (Business Logic)
    // ============================================

    const reportsPage = new ReportsPage(page);

    // Navigate to reports
    await navigation.goToReports();
    await page.waitForURL(/\/reports/);
    await reportsPage.waitForLoad();

    // Verify reports page loaded
    await expect(reportsPage.pageTitle).toBeVisible();

    // Verify business logic features present
    expect(await reportsPage.hasFilters()).toBeTruthy();

    // ============================================
    // SUCCESS: Core features verified ✅
    // ============================================
  });

  test("should handle authentication failure gracefully", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Attempt login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Should show error
    await loginPage.waitForError();
    const errorText = await loginPage.getErrorText();
    expect(errorText.toLowerCase()).toMatch(/nieprawidłowy|invalid|error/);

    // Should stay on login page
    await expect(page).toHaveURL(/\/signin/);
  });

  test("should protect routes when not authenticated", async ({ page, context }) => {
    // Clear session
    await context.clearCookies();
    await context.clearPermissions();

    // Try to access protected routes directly
    const protectedRoutes = ["/dashboard", "/drivers", "/reports", "/vehicles"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should redirect to signin
      await expect(page).toHaveURL(/\/signin/, { timeout: 5000 });
    }
  });

  test("should maintain session across page navigations", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const navigation = new Navigation(page);
    const driversPage = new DriversPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login(testConfig.testEmail, testConfig.testPassword);
    await page.waitForURL(/\/dashboard/);

    // Navigate between pages
    await navigation.goToDrivers();
    await driversPage.waitForLoad();
    expect(await driversPage.pageTitle.isVisible()).toBeTruthy();

    await navigation.goToDashboard();
    await dashboard.waitForLoad();
    expect(await dashboard.isLoaded()).toBeTruthy();

    // Session should still be valid - no redirect to login
    await expect(page).not.toHaveURL(/\/signin/);
  });
});

/**
 * API Testing: Backend validation
 */
test.describe("API Integration", () => {
  test("should return 401 for unauthenticated API requests", async ({ request }) => {
    const response = await request.get("/api/drivers");
    expect(response.status()).toBe(401);
  });

  test("should accept authenticated API requests", async ({ page }) => {
    // Login first to get session
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testConfig.testEmail, testConfig.testPassword);
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Make API request using page context (shares cookies)
    const response = await page.request.get("/api/drivers");

    expect(response.status()).toBe(200);
  });
});

/**
 * Performance Testing
 */
test.describe("Performance", () => {
  test("dashboard should load within acceptable time", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // Login
    await loginPage.goto();
    await loginPage.login(testConfig.testEmail, testConfig.testPassword);

    // Measure dashboard load time
    const startTime = Date.now();
    await page.waitForURL(/\/dashboard/);
    await dashboard.waitForLoad();
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds (generous for CI)
    expect(loadTime).toBeLessThan(5000);
  });
});
