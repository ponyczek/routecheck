import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model: Login Page
 *
 * Encapsulates login page interactions and locators
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly sessionExpiredNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[role="alert"], .error-message');
    this.sessionExpiredNotice = page.locator("text=/sesja wygasła|session expired/i");
  }

  async goto() {
    await this.page.goto("/signin");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: "visible", timeout: 5000 });
  }

  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}

/**
 * Page Object Model: Dashboard Page
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly metricsCards: Locator;
  readonly activeDriversMetric: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // More specific selector for dashboard heading - use main content area
    this.pageTitle = page.locator("main h1, [role='main'] h1").first();
    this.metricsCards = page.locator('[data-testid="metric-card"], .metric-card, div:has(> h3)').first();
    // Look for any metric text that might appear
    this.activeDriversMetric = page.locator("text=/Aktywni kierowcy|Active drivers|kierowcy|drivers/i").first();
    this.refreshButton = page
      .locator('button:has-text("Odśwież"), button:has-text("Refresh"), button[aria-label*="refresh" i]')
      .first();
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForLoad() {
    // Wait for page to fully load
    await this.page.waitForLoadState("networkidle");

    // Wait for either the title or any content to appear
    try {
      await this.pageTitle.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      // If title not found, wait for any metrics or content
      await this.page
        .locator("text=/Dashboard|Dzisiaj|kierowcy|drivers|raporty|reports/i")
        .first()
        .waitFor({ state: "visible", timeout: 5000 });
    }
  }

  async isLoaded(): Promise<boolean> {
    return await this.pageTitle.isVisible();
  }
}

/**
 * Page Object Model: Drivers Page
 */
export class DriversPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly addDriverButton: Locator;
  readonly searchInput: Locator;
  readonly driversList: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page
      .locator("main h1, [role='main'] h1")
      .filter({ hasText: /Kierowcy|Drivers/i })
      .first();
    this.addDriverButton = page
      .locator(
        'button:has-text("Dodaj kierowcę"), button:has-text("Add driver"), button:has-text("Dodaj pierwszego kierowcę")'
      )
      .first();
    this.searchInput = page
      .locator('input[type="search"], input[placeholder*="Szukaj"], input[placeholder*="Search"]')
      .first();
    this.driversList = page.locator('table, [data-testid="driver-card"]');
    this.emptyState = page.locator("text=/Brak kierowców|No drivers/i");
  }

  async goto() {
    await this.page.goto("/drivers");
  }

  async waitForLoad() {
    await this.pageTitle.waitFor({ state: "visible", timeout: 5000 });
  }

  async clickAddDriver() {
    await this.addDriverButton.click();
  }

  async searchDriver(query: string) {
    if ((await this.searchInput.count()) > 0) {
      await this.searchInput.fill(query);
      // Wait for debounce
      await this.page.waitForTimeout(500);
    }
  }

  getDriverRow(name: string): Locator {
    return this.page.locator(`text="${name}"`);
  }

  async hasDrivers(): Promise<boolean> {
    return (await this.driversList.count()) > 0 || (await this.emptyState.count()) > 0;
  }
}

/**
 * Page Object Model: Driver Form Modal
 */
export class DriverFormModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly timezoneField: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"], .modal');
    this.nameInput = this.modal.locator('input[name="name"]');
    this.emailInput = this.modal.locator('input[name="email"]');
    this.timezoneField = this.modal.locator('select[name="timezone"], input[name="timezone"]').first();
    this.submitButton = this.modal.locator('button:has-text("Zapisz"), button:has-text("Save")').last();
    this.cancelButton = this.modal.locator('button:has-text("Anuluj"), button:has-text("Cancel")');
    this.errorAlert = this.modal.locator('[role="alert"], .error');
  }

  async waitForOpen() {
    await this.modal.waitFor({ state: "visible", timeout: 5000 });
  }

  async fillForm(data: { name: string; email: string; timezone?: string }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);

    if (data.timezone && (await this.timezoneField.count()) > 0) {
      const isSelect = await this.timezoneField.evaluate((el) => el.tagName === "SELECT");
      if (isSelect) {
        await this.timezoneField.selectOption(data.timezone);
      } else {
        // Combobox
        await this.timezoneField.fill(data.timezone);
        await this.page.keyboard.press("Enter");
      }
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForClose() {
    await this.modal.waitFor({ state: "hidden", timeout: 5000 });
  }

  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }
}

/**
 * Page Object Model: Reports Page
 */
export class ReportsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly filtersBar: Locator;
  readonly searchInput: Locator;
  readonly reportsList: Locator;
  readonly exportButton: Locator;
  readonly addReportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page
      .locator("main h1, [role='main'] h1")
      .filter({ hasText: /Raporty|Reports/i })
      .first();
    this.filtersBar = page.locator('[data-testid="filters-bar"], .filters-bar, div:has(input[placeholder*="Szukaj"])');
    this.searchInput = page.locator('input[placeholder*="Szukaj"]').first();
    this.reportsList = page.locator('[data-testid="reports-list"], table, .reports-grid');
    this.exportButton = page.locator('button:has-text("Eksportuj"), button:has-text("Export")');
    this.addReportButton = page.locator('button:has-text("Dodaj raport"), button:has-text("Add report")');
  }

  async goto() {
    await this.page.goto("/reports");
  }

  async waitForLoad() {
    await this.pageTitle.waitFor({ state: "visible", timeout: 5000 });
  }

  async hasFilters(): Promise<boolean> {
    return (await this.searchInput.count()) > 0 || (await this.filtersBar.count()) > 0;
  }
}

/**
 * Page Object Model: Navigation
 */
export class Navigation {
  readonly page: Page;
  readonly dashboardLink: Locator;
  readonly driversLink: Locator;
  readonly reportsLink: Locator;
  readonly vehiclesLink: Locator;
  readonly settingsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // More flexible selectors for navigation links
    this.dashboardLink = page.locator('a[href="/dashboard"]').first();
    this.driversLink = page.locator('a[href="/drivers"]').first();
    this.reportsLink = page.locator('a[href="/reports"]').first();
    this.vehiclesLink = page.locator('a[href="/vehicles"]').first();
    this.settingsLink = page.locator('a[href*="/settings"]').first();
  }

  async goToDashboard() {
    await this.dashboardLink.click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async goToDrivers() {
    await this.driversLink.click();
    await this.page.waitForURL(/\/drivers/);
  }

  async goToReports() {
    await this.reportsLink.click();
    await this.page.waitForURL(/\/reports/);
  }

  async goToVehicles() {
    await this.vehiclesLink.click();
    await this.page.waitForURL(/\/vehicles/);
  }

  async goToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL(/\/settings/);
  }
}
