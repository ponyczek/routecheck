# Testing Guide - Quick Reference Card

## 🚀 Quick 10-Minute Test Flow

### Setup (One-time, 5 min)

```bash
# 1. Install & Start
npm install
npm run dev

# 2. Apply migrations (Supabase SQL Editor)
# Run files from supabase/migrations/ in order

# 3. Create test user (Supabase SQL Editor)
# See README.md setup section
```

### Testing Flow (5 min)

#### 1️⃣ Login (30 sec)

- Go to http://localhost:4321
- Login: `test@routecheck.app` / `TestPassword123!`
- ✅ Verify: Dashboard loads

#### 2️⃣ Add Driver (1 min)

- Click "Kierowcy" → "Dodaj kierowcę"
- Fill: `Jan Testowy` / `jan@example.com` / `Europe/Warsaw`
- ✅ Verify: Driver appears in list

#### 3️⃣ Submit Report (2 min)

```bash
# Generate token
npm run generate-test-token -- jan@example.com

# Copy link and open in browser
# Submit "Wszystko OK"
```

- ✅ Verify: Success message + 10-min edit countdown

#### 4️⃣ Check Dashboard (1 min)

- Go to `/dashboard`
- ✅ Verify: Shows 1 active driver, 1 submitted report, 0 pending

#### 5️⃣ Submit Problem Report (1.5 min)

```bash
# Add another driver first
# Then generate token for them
npm run generate-test-token
```

- Toggle "Zgłoś problem"
- Fill: 45 min delay, reason: "Korek"
- Submit
- ✅ Verify: AI summary shows "LOW" risk (yellow badge)

#### 6️⃣ Check Reports (30 sec)

- Go to `/reports`
- ✅ Verify: 2 reports, different risk levels, AI summaries

---

## 🧪 Run Automated Tests

```bash
# Unit tests (52 tests)
npm test

# E2E tests (requires build)
npm run build
npm run test:e2e

# View report
npx playwright show-report
```

✅ All tests should pass!

---

## ✅ Feature Checklist

Quick verification for mentors:

- [ ] **Auth**: Login → redirect to dashboard
- [ ] **CRUD**: Create driver → appears in list
- [ ] **Dashboard**: Shows real counts from DB
- [ ] **Public Form**: Token link → submit → success
- [ ] **AI Mock**: Problem report → risk badge + summary
- [ ] **Reports**: List shows AI summaries with risk colors
- [ ] **CSV Export**: Download works
- [ ] **Tests**: `npm test` → 52 passing
- [ ] **E2E**: `npm run test:e2e` → all passing
- [ ] **CI/CD**: GitHub Actions workflow exists

---

## 🎥 Demo Script (for video/presentation)

**30-second demo**:

1. Show login → dashboard (3s)
2. Add driver → appears in list (5s)
3. Generate token → submit report (7s)
4. Dashboard updates with metrics (5s)
5. Reports view with AI summaries (5s)
6. Run tests → all passing (5s)

**Total**: Real working MVP in 30 seconds!

---

## 📞 Support

Stuck? Check:

1. `README.md` - Full setup guide
2. `SUBMISSION_CHECKLIST.md` - Complete feature list
3. `docs/` - Detailed documentation
4. Console logs - Error messages
5. GitHub Actions - CI status
