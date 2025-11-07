# Public Report Submission Endpoint - Usage Examples

## Endpoint URL

```
POST /api/public/report-links/{token}/reports
```

## Request Examples

### Example 1: Completed Route (No Issues)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }'
```

**Response (201 Created):**

```json
{
  "reportUuid": "550e8400-e29b-41d4-a716-446655440000",
  "editableUntil": "2025-11-07T21:10:00Z"
}
```

---

### Example 2: Completed with Delay

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 45,
    "delayReason": "Heavy traffic on highway A1",
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }'
```

**Response (201 Created):**

```json
{
  "reportUuid": "550e8400-e29b-41d4-a716-446655440001",
  "editableUntil": "2025-11-07T21:15:00Z"
}
```

---

### Example 3: Partially Completed with Issues

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "PARTIALLY_COMPLETED",
    "delayMinutes": 120,
    "delayReason": "Vehicle breakdown on route",
    "cargoDamageDescription": null,
    "vehicleDamageDescription": "Flat tire - replaced with spare",
    "nextDayBlockers": "Need to replace spare tire before next route",
    "timezone": "Europe/Warsaw"
  }'
```

**Response (201 Created):**

```json
{
  "reportUuid": "550e8400-e29b-41d4-a716-446655440002",
  "editableUntil": "2025-11-07T21:20:00Z"
}
```

---

### Example 4: Cancelled Route

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "CANCELLED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": "Route cancelled by dispatcher",
    "timezone": "Europe/Warsaw"
  }'
```

**Response (201 Created):**

```json
{
  "reportUuid": "550e8400-e29b-41d4-a716-446655440003",
  "editableUntil": "2025-11-07T21:25:00Z"
}
```

---

## Error Examples

### Error 1: Invalid Token (404)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/invalid-token/reports \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response (404 Not Found):**

```json
{
  "code": "not_found",
  "message": "Report link not found"
}
```

---

### Error 2: Expired Token (410)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/expired-token/reports \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response (410 Gone):**

```json
{
  "code": "gone",
  "message": "Report link has expired"
}
```

---

### Error 3: Already Used Token (409)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/used-token/reports \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response (409 Conflict):**

```json
{
  "code": "conflict",
  "message": "Report link has already been used"
}
```

---

### Error 4: Validation Error - Missing delayReason (400)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "COMPLETED",
    "delayMinutes": 30,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }'
```

**Response (400 Bad Request):**

```json
{
  "code": "validation_error",
  "message": "Invalid request data",
  "details": {
    "delayReason": "delayReason is required when delayMinutes is greater than 0"
  }
}
```

---

### Error 5: Validation Error - PARTIALLY_COMPLETED Missing Description (400)

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{
    "routeStatus": "PARTIALLY_COMPLETED",
    "delayMinutes": 0,
    "delayReason": null,
    "cargoDamageDescription": null,
    "vehicleDamageDescription": null,
    "nextDayBlockers": null,
    "timezone": "Europe/Warsaw"
  }'
```

**Response (400 Bad Request):**

```json
{
  "code": "validation_error",
  "message": "Invalid request data",
  "details": {
    "routeStatus": "For PARTIALLY_COMPLETED status, at least one descriptive field (nextDayBlockers, cargoDamageDescription, vehicleDamageDescription, or delayReason) must be provided"
  }
}
```

---

### Error 6: Rate Limit Exceeded (429)

After 5 submissions with the same token in 1 minute:

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/abc123token/reports \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response (429 Too Many Requests):**

```json
{
  "code": "rate_limited",
  "message": "Too many requests for this token. Please try again later."
}
```

**Response Headers:**

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699391400
```

---

### Error 7: Duplicate Report for Date (409)

Attempting to submit a second report for the same driver on the same date:

```bash
curl -X POST \
  https://your-domain.com/api/public/report-links/another-token/reports \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**Response (409 Conflict):**

```json
{
  "code": "conflict",
  "message": "A report for this driver and date already exists",
  "details": {
    "existingReportUuid": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## JavaScript/TypeScript Client Example

```typescript
interface ReportSubmission {
  routeStatus: "COMPLETED" | "PARTIALLY_COMPLETED" | "CANCELLED";
  delayMinutes: number;
  delayReason: string | null;
  cargoDamageDescription: string | null;
  vehicleDamageDescription: string | null;
  nextDayBlockers: string | null;
  timezone: string;
}

interface ReportResponse {
  reportUuid: string;
  editableUntil: string;
}

interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

async function submitReport(token: string, data: ReportSubmission): Promise<ReportResponse> {
  const response = await fetch(`/api/public/report-links/${token}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(`${error.code}: ${error.message}`);
  }

  return response.json();
}

// Usage
try {
  const result = await submitReport("abc123token", {
    routeStatus: "COMPLETED",
    delayMinutes: 0,
    delayReason: null,
    cargoDamageDescription: null,
    vehicleDamageDescription: null,
    nextDayBlockers: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect timezone
  });

  console.log("Report submitted:", result.reportUuid);
  console.log("Editable until:", new Date(result.editableUntil));
} catch (error) {
  console.error("Failed to submit report:", error.message);
}
```

---

## React Hook Example

```typescript
import { useState } from 'react';

interface UseReportSubmissionReturn {
  submit: (token: string, data: ReportSubmission) => Promise<void>;
  loading: boolean;
  error: string | null;
  result: ReportResponse | null;
}

export function useReportSubmission(): UseReportSubmissionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportResponse | null>(null);

  const submit = async (token: string, data: ReportSubmission) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/public/report-links/${token}/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error, result };
}

// Usage in component
function ReportForm({ token }: { token: string }) {
  const { submit, loading, error, result } = useReportSubmission();

  const handleSubmit = async (formData: ReportSubmission) => {
    await submit(token, formData);
  };

  if (result) {
    return <div>Report submitted! UUID: {result.reportUuid}</div>;
  }

  return (
    <form onSubmit={(e) => { /* form logic */ }}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}
```

---

## Validation Rules Summary

### Required Fields

- `routeStatus` - Must be one of: COMPLETED, PARTIALLY_COMPLETED, CANCELLED
- `delayMinutes` - Must be integer ≥ 0
- `timezone` - Must be valid IANA timezone identifier

### Conditional Requirements

- If `delayMinutes > 0`, then `delayReason` is required
- If `routeStatus = PARTIALLY_COMPLETED`, then at least one of these must be provided:
  - `nextDayBlockers`
  - `cargoDamageDescription`
  - `vehicleDamageDescription`
  - `delayReason`

### Text Field Limits

All text fields have a maximum length of 2000 characters:

- `delayReason`
- `cargoDamageDescription`
- `vehicleDamageDescription`
- `nextDayBlockers`

### Rate Limits

- Per IP: 30 requests per minute
- Per Token: 5 requests per minute

---

## Testing the Endpoint

### Using curl (Development)

```bash
# Set your base URL
BASE_URL="http://localhost:4321"
TOKEN="your-test-token"

# Submit a test report
curl -X POST \
  "${BASE_URL}/api/public/report-links/${TOKEN}/reports" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "routeStatus": "COMPLETED",
  "delayMinutes": 0,
  "delayReason": null,
  "cargoDamageDescription": null,
  "vehicleDamageDescription": null,
  "nextDayBlockers": null,
  "timezone": "Europe/Warsaw"
}
EOF
```

### Using Postman/Insomnia

1. Create new POST request
2. URL: `{{base_url}}/api/public/report-links/{{token}}/reports`
3. Headers: `Content-Type: application/json`
4. Body: Use examples above
5. Send and verify 201 response

---

## Timezone Reference

Common IANA timezone identifiers:

- Europe: `Europe/Warsaw`, `Europe/London`, `Europe/Paris`, `Europe/Berlin`
- Americas: `America/New_York`, `America/Chicago`, `America/Los_Angeles`
- Asia: `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Dubai`
- Australia: `Australia/Sydney`, `Australia/Melbourne`
- UTC: `UTC`

You can use `Intl.DateTimeFormat().resolvedOptions().timeZone` in JavaScript to auto-detect the client timezone.
