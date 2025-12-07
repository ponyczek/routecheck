# Testing Guide - Public Report Form

This guide provides comprehensive testing scenarios for the public report form implementation.

## 🎯 Testing Scope

### Components to Test

- TokenGuard validation flow
- Form submission (happy path + problem path)
- Inline validation
- Offline queue functionality
- Edit functionality
- Error handling
- Accessibility
- Mobile responsiveness

## 🧪 Manual Testing Scenarios

### 1. Token Validation

#### Test 1.1: Valid Token

**Steps:**

1. Navigate to `/public/report-links/{valid-token}`
2. Wait for loading state
3. Observe form loads with driver data

**Expected:**

- Loading skeleton displays briefly
- Form appears with driver name and vehicle
- "Wszystko OK" is pre-selected
- No error messages

#### Test 1.2: Invalid Token (404)

**Steps:**

1. Navigate to `/public/report-links/invalid-token-123`

**Expected:**

- Error view displays
- Title: "Link nie został znaleziony"
- "Spróbuj ponownie" button visible
- Contact info shown

#### Test 1.3: Expired Token (410)

**Steps:**

1. Use an expired token (>24h old)

**Expected:**

- Error view with clock icon
- Title: "Link wygasł"
- Description mentions 24-hour validity
- No retry button

#### Test 1.4: Already Used Token (409)

**Steps:**

1. Submit a report with a token
2. Open the same token link again

**Expected:**

- Error view with checkmark icon
- Title: "Raport już wysłany"
- Mention of edit link
- No retry button

### 2. Happy Path Submission

#### Test 2.1: Quick Submit

**Steps:**

1. Open valid token link
2. Keep "Wszystko OK" selected
3. Click "Wyślij raport - Wszystko OK"

**Expected:**

- Button shows "Wysyłam..." with spinner
- Success view appears
- Green checkmark displayed
- Countdown timer shows 10:00
- "Edytuj raport" button visible
- Toast: "Raport wysłany pomyślnie"

#### Test 2.2: Happy Path Data Verification

**Verify API payload:**

```json
{
  "routeStatus": "COMPLETED",
  "delayMinutes": 0,
  "delayReason": null,
  "cargoDamageDescription": null,
  "vehicleDamageDescription": null,
  "nextDayBlockers": null,
  "timezone": "Europe/Warsaw"
}
```

### 3. Problem Path Submission

#### Test 3.1: Switch to Problem Path

**Steps:**

1. Open valid token link
2. Click "Mam problem" button

**Expected:**

- Button becomes active (orange border)
- Problem fields appear with animation
- Route status field visible
- Delay fields visible
- Damage fields visible
- Blockers field visible

#### Test 3.2: Complete Problem Report

**Steps:**

1. Select "Mam problem"
2. Choose route status: "Częściowo wykonano"
3. Enter delay: 60 minutes
4. Enter delay reason: "Awaria pojazdu na autostradzie"
5. Enter cargo damage: "Pęknięcie opakowania"
6. Enter vehicle damage: "Uszkodzony zderzak"
7. Enter blockers: "Pojazd wymaga naprawy"
8. Click submit

**Expected:**

- All fields validate successfully
- Submit succeeds
- Success view appears
- AI processing banner shows

#### Test 3.3: Delay Reason Conditional Display

**Steps:**

1. Select "Mam problem"
2. Enter delay: 0 minutes
3. Observe no delay reason field
4. Change delay to: 30 minutes

**Expected:**

- Delay reason field appears with animation
- Field is marked as required (\*)
- Placeholder text visible

### 4. Validation Testing

#### Test 4.1: Delay Reason Required

**Steps:**

1. Select "Mam problem"
2. Enter delay: 60 minutes
3. Leave delay reason empty
4. Click submit

**Expected:**

- Form doesn't submit
- Error under delay reason field
- Message: "Powód opóźnienia jest wymagany..."
- Focus moves to error field

#### Test 4.2: Delay Reason Min Length

**Steps:**

1. Enter delay: 30 minutes
2. Enter delay reason: "XY" (2 chars)
3. Blur field

**Expected:**

- Error appears: "Powód musi mieć minimum 3 znaki"
- Field has red border
- ARIA invalid state

#### Test 4.3: Partial Completion Validation

**Steps:**

1. Select route status: "Częściowo wykonano"
2. Leave both delay reason and blockers empty
3. Click submit

**Expected:**

- Validation error
- Message under blockers field
- Cannot submit until one is filled

#### Test 4.4: Max Length Validation

**Steps:**

1. Enter 1001 characters in any textarea
2. Try to submit

**Expected:**

- Cannot type beyond 1000 chars
- Counter shows "Max 1000 znaków"

### 5. Offline Functionality

#### Test 5.1: Submit While Offline

**Steps:**

1. Open DevTools → Network
2. Set to "Offline"
3. Fill and submit form

**Expected:**

- Orange banner appears: "Brak połączenia"
- Button text: "Wyślę gdy będzie sieć"
- On submit: Toast "Raport zapisany offline"
- Success view shows "Raport zapisany offline"

#### Test 5.2: Auto-Send After Coming Online

**Steps:**

1. Submit while offline (from 5.1)
2. Set network to "Online"

**Expected:**

- Automatic processing begins
- Toast: "Raport wysłany po przywróceniu połączenia"
- Real success view appears with report UUID

#### Test 5.3: Multiple Offline Reports

**Steps:**

1. Go offline
2. Submit 3 different reports
3. Come back online

**Expected:**

- All 3 reports process sequentially
- 3 success toasts appear
- Last report shows in success view

#### Test 5.4: Failed Retry Logic

**Simulation:** Mock API to always fail

**Expected:**

- Retry 3 times
- After 3rd failure: Toast "Nie udało się wysłać"
- Item removed from queue

### 6. Edit Functionality

#### Test 6.1: Edit Within 10 Minutes

**Steps:**

1. Submit a report
2. On success view, click "Edytuj raport"
3. Modify some fields
4. Click submit

**Expected:**

- Form reappears with previous data pre-filled
- Toast: "Możesz teraz edytować raport"
- Changes save successfully
- PATCH request sent
- Success view returns
- Countdown continues (doesn't reset)

#### Test 6.2: Edit Window Expiration

**Steps:**

1. Submit a report
2. Wait for countdown to reach 0:00

**Expected:**

- "Edytuj raport" button becomes disabled
- Text changes to "Okno edycji minęło"
- Countdown shows "0:00"
- Clicking edit shows warning toast

#### Test 6.3: Edit After Window Expired (API)

**Steps:**

1. Try to PATCH after 10 minutes

**Expected:**

- 409 response from API
- Toast: "Okno edycji minęło"
- Edit button disabled

### 7. Error Handling

#### Test 7.1: Server Error (500)

**Steps:**

1. Mock API to return 500
2. Submit form

**Expected:**

- Error view appears
- Server crash icon
- "Spróbuj ponownie" button
- Retry reloads page

#### Test 7.2: Validation Error (400)

**Steps:**

1. Mock API to return validation error

**Expected:**

- Errors appear under specific fields
- Toast: "Sprawdź poprawność pól"
- Form stays open

#### Test 7.3: Network Error

**Steps:**

1. Submit form
2. Abort network request mid-flight

**Expected:**

- Toast error message
- Form stays open
- Can retry

### 8. Accessibility Testing

#### Test 8.1: Keyboard Navigation

**Steps:**

1. Use only Tab/Shift+Tab
2. Navigate entire form
3. Submit using Enter

**Expected:**

- All interactive elements focusable
- Focus indicator visible
- Logical tab order
- Can submit with keyboard

#### Test 8.2: Screen Reader

**Tool:** VoiceOver (Mac) or NVDA (Windows)

**Verify:**

- Form labels announced correctly
- Error messages read aloud
- Loading state announced
- Required fields indicated
- Button states announced

#### Test 8.3: ARIA Attributes

**Check:**

- `aria-invalid` on error fields
- `aria-describedby` links to errors
- `aria-live="polite"` on banners
- `aria-busy` during loading
- `role="alert"` on errors

### 9. Mobile Responsiveness

#### Test 9.1: iPhone SE (320px)

**Verify:**

- Form fields not cut off
- Buttons full width
- Text readable without zoom
- Tap targets ≥ 44x44px

#### Test 9.2: Standard Mobile (375px)

**Verify:**

- StatusSwitch buttons stack vertically
- All content visible
- No horizontal scroll

#### Test 9.3: Tablet (768px)

**Verify:**

- StatusSwitch shows 2 columns
- Optimal content width
- Good use of space

#### Test 9.4: Landscape Mode

**Verify:**

- Form doesn't break
- All content accessible
- No awkward spacing

### 10. Telemetry Verification

**Monitor network tab for POST /api/telemetry**

#### Verify Events Sent:

1. **FORM_SUBMIT** after successful submission
   - `duration` (seconds)
   - `interactions` (count)
   - `switchedToProblems` (boolean)
   - `linkUuid`
   - `reportUuid`

2. **TOKEN_INVALID** on token errors
   - `errorCode` (404/409/410)
   - `linkUuid`

### 11. Performance Testing

#### Test 11.1: Time to Interactive

**Measure:**

- Initial page load → form interactive
- **Target:** < 2s on 4G

#### Test 11.2: Bundle Size

**Check:**

- Main bundle < 200KB gzipped
- Code splitting working
- No duplicate dependencies

#### Test 11.3: Form Response Time

**Measure:**

- Field interaction → UI update
- **Target:** < 100ms

## 🤖 Automated Testing (Future)

### Unit Tests (Vitest)

```typescript
// Example tests to implement
describe("reportFormSchema", () => {
  test("validates happy path", () => {
    const data = { isProblem: false /* ... */ };
    expect(reportFormSchema.parse(data)).toBeDefined();
  });

  test("requires delayReason when delay > 0", () => {
    const data = { isProblem: true, delayMinutes: 30, delayReason: "" };
    expect(() => reportFormSchema.parse(data)).toThrow();
  });
});
```

### Component Tests (Testing Library)

```typescript
describe("StatusSwitch", () => {
  test("switches between happy and problem path", () => {
    // Test implementation
  });
});
```

### E2E Tests (Playwright)

```typescript
test("complete happy path flow", async ({ page }) => {
  await page.goto("/public/report-links/valid-token");
  await page.click("text=Wyślij raport");
  await expect(page.locator("text=wysłany pomyślnie")).toBeVisible();
});
```

## ✅ Testing Checklist

Before considering implementation complete, verify:

- [ ] All 11 manual test scenarios pass
- [ ] No linter errors
- [ ] All TypeScript types correct
- [ ] Console has no errors/warnings
- [ ] Network tab shows correct API calls
- [ ] Offline functionality works
- [ ] Edit functionality works
- [ ] Telemetry events sent
- [ ] Mobile responsive (320px-1024px)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Performance targets met

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property of undefined"

**Solution:** Check TokenGuard validation data is loaded before rendering form

### Issue: Offline queue not processing

**Solution:** Verify IndexedDB is initialized and `useOfflineQueue` hook is called with correct params

### Issue: Edit button not working

**Solution:** Check SessionStorage has report token stored

### Issue: Validation not triggering

**Solution:** Ensure React Hook Form mode is set to 'onBlur' and schema is correct

## 📞 Support

For testing issues, contact the development team or check implementation plan.
