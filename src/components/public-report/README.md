# Public Report Form - Implementation

This directory contains the complete implementation of the public report form for RouteLog - a mobile-first form that allows drivers to submit daily route reports via a one-time email link.

## 📋 Overview

The public report form is a critical component that enables:

- Quick report submission via one-time token link (expires in 24h)
- Two-path UX: "Happy Path" (all OK) vs "Problem Path" (issues to report)
- Offline support with automatic queue processing
- 10-minute edit window after submission
- Telemetry tracking for UX optimization

## 🏗️ Architecture

### Component Hierarchy

```
PublicReportForm (main orchestrator)
├── TokenGuard (validation wrapper)
│   ├── FormLoadingState
│   └── ErrorView
├── FormHeader
├── OfflineBanner
├── StatusSwitch
├── HappyPathSection (conditional)
├── ProblemPathSection (conditional)
│   ├── RouteStatusField
│   ├── DelayFields
│   ├── DamageFields
│   └── BlockersField
├── SubmitButton
├── FormFooter
└── SuccessView (post-submit)
    └── CountdownTimer
```

### State Management

1. **Token Validation** - `useTokenValidation` hook
   - Validates token on mount
   - Checks for duplicate usage (SessionStorage)
   - Returns validation data or error

2. **Form State** - React Hook Form + Zod
   - Schema-based validation
   - Conditional field requirements
   - Server error handling

3. **View State Machine**
   - `loading` → Token validation in progress
   - `form` → Main form display
   - `success` → Post-submission confirmation
   - `error` → Token/submission error

4. **Network Status** - `useNetworkStatus` hook
   - Monitors online/offline
   - Triggers offline queue processing

5. **Telemetry** - `useTelemetry` hook
   - Tracks form duration
   - Counts field interactions
   - Records problem path switches

## 📂 File Structure

```
src/components/public-report/
├── PublicReportForm.tsx       # Main orchestrator
├── TokenGuard.tsx             # Token validation wrapper
├── ErrorView.tsx              # Error state display
├── SuccessView.tsx            # Success confirmation
├── FormLoadingState.tsx       # Skeleton loader
├── CountdownTimer.tsx         # Edit window countdown
├── StatusSwitch.tsx           # Happy/Problem toggle
├── HappyPathSection.tsx       # "All OK" display
├── ProblemPathSection.tsx     # Problem fields composite
├── FormHeader.tsx             # Driver greeting
├── FormFooter.tsx             # Edit info footer
├── OfflineBanner.tsx          # Offline alert
├── SubmitButton.tsx           # Submit with states
├── fields/
│   ├── RouteStatusField.tsx   # Route status radio group
│   ├── DelayFields.tsx        # Delay minutes + reason
│   ├── DamageFields.tsx       # Cargo + vehicle damage
│   └── BlockersField.tsx      # Next day blockers
└── index.ts                   # Barrel exports

src/lib/public-report/
├── api.ts                     # API functions
├── validation.ts              # Zod schemas + types
├── hooks/
│   ├── useTokenValidation.ts
│   ├── useNetworkStatus.ts
│   └── useTelemetry.ts
└── utils/
    ├── formatters.ts          # Date/time formatting
    └── storage.ts             # SessionStorage helpers

src/pages/public/report-links/
└── [token].astro             # Main page route
```

## 🔌 API Integration

### Endpoints Used

1. **GET /api/public/report-links/{token}**
   - Validates token and returns driver/vehicle data
   - Responses: 200 (valid), 404 (not found), 409 (used), 410 (expired)

2. **POST /api/public/report-links/{token}/reports**
   - Submits new report
   - Returns reportUuid and editableUntil timestamp

3. **PATCH /api/public/reports/{uuid}**
   - Updates existing report (within 10-min window)
   - Requires Authorization: Bearer {token}

4. **POST /api/telemetry**
   - Sends telemetry events (fire-and-forget)

## 🎨 User Flows

### Happy Path Flow

1. Driver clicks email link → Token validation
2. Form loads with "Wszystko OK" selected
3. Driver clicks "Wyślij raport" → Submission
4. Success view with edit button (10 min window)

### Problem Path Flow

1. Driver clicks email link → Token validation
2. Driver switches to "Mam problem"
3. Problem fields appear:
   - Route status (required)
   - Delay minutes + reason (conditional)
   - Damage descriptions (optional)
   - Next day blockers (optional)
4. Driver fills fields → Validation
5. Submit → Success view

### Edit Flow

1. From success view, click "Edytuj raport"
2. Form reloads with previous data pre-filled
3. Driver modifies fields → Submit
4. PATCH request → Back to success view

### Offline Flow

1. Driver fills form while offline
2. OfflineBanner appears → Data queued in IndexedDB
3. Connection restored → Auto-send from queue
4. Toast notification → Success view

### Error Flow

1. Token validation fails → ErrorView
2. Shows appropriate message (404/409/410/500)
3. Optional retry button or contact info

## ✅ Validation Rules

### Happy Path

- All problem fields set to null/default
- Only timezone is sent to API

### Problem Path

- `routeStatus`: required, one of enum values
- `delayMinutes`: required, >= 0
- `delayReason`: required if delayMinutes > 0, min 3 chars
- If `PARTIALLY_COMPLETED`: requires comment in delayReason OR nextDayBlockers
- All textarea fields: max 1000 chars

## 🎯 Key Features

### Mobile-First UX

- Large tap targets (min 44x44px)
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for small screens

### Accessibility (A11y)

- ARIA labels and live regions
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Error announcements

### Performance

- Code splitting ready
- Lazy component loading
- Optimized re-renders
- Minimal bundle size

### Security

- Token single-use check (SessionStorage)
- 24-hour expiration
- 10-minute edit window
- No sensitive data in URL params

## 🧪 Testing Checklist

- [ ] Token validation (valid/invalid/expired/used)
- [ ] Happy path submission
- [ ] Problem path with all field combinations
- [ ] Inline validation errors
- [ ] Delay reason conditional display
- [ ] Partial completion validation
- [ ] Edit functionality (within/after 10 min)
- [ ] Offline queue and auto-send
- [ ] Network status changes
- [ ] Telemetry events
- [ ] Mobile responsiveness (320px-1024px)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## 🚀 Usage Example

```tsx
// In Astro page
import { PublicReportForm } from "@/components/public-report";
import { QueryProvider } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

<QueryProvider client:only="react">
  <PublicReportForm client:only="react" token={token} onSuccess={(data) => console.log("Report submitted:", data)} />
  <Toaster client:only="react" />
</QueryProvider>;
```

## 📝 Future Enhancements

- [ ] Service Worker for advanced offline support
- [ ] Image upload for damage documentation
- [ ] Voice input for text fields
- [ ] PWA installation prompt
- [ ] Multi-language support (i18n)
- [ ] Dark mode support

## 🐛 Known Issues

None at this time.

## 📞 Support

For issues or questions, contact the RouteLog development team.
