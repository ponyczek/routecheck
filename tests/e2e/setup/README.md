# E2E Test Setup

## Prerequisites

Before running E2E tests, you need:

1. **Test Database**: Separate Supabase project for testing (recommended) or seed data in dev database
2. **Test User**: A user account with valid credentials
3. **.env.test file**: Environment configuration with test credentials

## Environment Variables

⚠️ **Security Warning**: 
- Never commit `.env.test` to version control
- Use a separate test Supabase project (recommended)
- Never use production credentials for testing

Create a `.env.test` file in the project root with the following variables:

```bash
# Test user credentials
TEST_USER_EMAIL=test@routecheck.app
TEST_USER_PASSWORD=your-secure-test-password

# Supabase configuration (use separate test project, NOT production!)
PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY

# Optional: Private token pepper for link generation (use random string)
PRIVATE_TOKEN_PEPPER=test-pepper-key-for-tokens-change-this

# Optional: Base URL for tests (default: http://127.0.0.1:4321)
BASE_URL=http://127.0.0.1:4321
```

**Important**: 
- The `.env.test` file is automatically loaded by Playwright configuration before running tests
- This file should be listed in `.gitignore` (already configured)
- Get your Supabase keys from: Dashboard → Settings → API

## Creating Test User

⚠️ **Security Note**: Use a dedicated test database or separate Supabase project for E2E tests. Never use production credentials in test files.

### Option 1: Supabase Dashboard

1. Go to Authentication → Users
2. Click "Add User"
3. Email: `test@routecheck.app`
4. Password: Choose a secure password (min 8 chars, uppercase, lowercase, number)
5. Confirm email automatically
6. Save credentials to your `.env.test` file

### Option 2: SQL Script

⚠️ **Replace `YOUR_SECURE_PASSWORD_HERE` with your actual test password before running!**

```sql
-- Run in Supabase SQL Editor
-- IMPORTANT: Replace YOUR_SECURE_PASSWORD_HERE with your test password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@routecheck.app',
  crypt('YOUR_SECURE_PASSWORD_HERE', gen_salt('bf')),
  now(),
  now(),
  now()
);

-- Also create company and user record
INSERT INTO companies (uuid, name)
VALUES (gen_random_uuid(), 'Test Company')
RETURNING uuid;

-- Use the returned UUID in the next insert
INSERT INTO users (uuid, company_uuid)
SELECT u.id, c.uuid
FROM auth.users u, companies c
WHERE u.email = 'test@routecheck.app'
AND c.name = 'Test Company';
```

**After creating the user**, add credentials to `.env.test`:

```bash
TEST_USER_EMAIL=test@routecheck.app
TEST_USER_PASSWORD=your-actual-password-here
```

## Running Tests

### Local Development

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/user-flow.spec.ts
```

### CI/CD

Tests run automatically on push/PR via GitHub Actions.

View test results and artifacts in the Actions tab.

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Troubleshooting

### Test fails on login

- Check test user exists in database
- Verify credentials in environment variables
- Check Supabase Auth settings (email confirmation required?)

### Timeouts

- Increase timeout in `playwright.config.ts`
- Check if dev server started properly
- Verify database connection

### Element not found

- Use Playwright Inspector: `npm run test:e2e:debug`
- Check if selectors match your actual HTML
- Verify page navigation completed

## Writing New Tests

See `user-flow.spec.ts` as example. Best practices:

### 1. Use Page Object Model

```typescript
// Good ✅
const loginPage = new LoginPage(page);
await loginPage.login(email, password);

// Bad ❌
await page.fill('input[name="email"]', email);
await page.click('button[type="submit"]');
```

### 2. Use Resilient Locators

```typescript
// Good ✅ - Role-based locators
page.locator('button:has-text("Submit")');
page.locator('[data-testid="submit-button"]');

// Bad ❌ - Fragile CSS selectors
page.locator(".btn.btn-primary.submit");
```

### 3. Wait for State Changes

```typescript
// Good ✅
await page.waitForURL(/\/dashboard/);
await expect(page.locator("h1")).toBeVisible();

// Bad ❌
await page.waitForTimeout(3000);
```

### 4. Test Isolation

- Each test should be independent
- Use beforeEach for setup
- Clear state between tests
- Don't rely on test execution order

### 5. Use Specific Assertions

```typescript
// Good ✅
await expect(element).toBeVisible();
await expect(element).toHaveText("Expected text");

// Bad ❌
expect(await element.isVisible()).toBe(true);
```

### 6. Leverage API Testing

```typescript
test("API returns correct data", async ({ request }) => {
  const response = await request.get("/api/drivers");
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("items");
});
```

### 7. Use Codegen for Discovery

```bash
# Record new tests interactively
npx playwright codegen http://localhost:4321
```

### 8. Debug with Trace Viewer

```bash
# After failed test with trace enabled
npx playwright show-trace trace.zip
```
