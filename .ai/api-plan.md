# REST API Plan

## 1. Resources

- companies → table: `companies`
- users → table: `users` (mapped to `auth.users` via FK)
- drivers → table: `drivers`
- vehicles → table: `vehicles`
- driverVehicleAssignments → table: `driver_vehicle_assignments`
- reports → table: `reports` (partitioned by `report_date`)
- reportAiResults → table: `report_ai_results`
- riskTags → table: `risk_tags`
- reportRiskTags → table: `report_risk_tags` (join)
- reportLinks → table: `report_links` (one-time public tokens)
- telemetryEvents → table: `telemetry_events` (partitioned by `occurred_at`)
- emailLogs → table: `email_logs`

Notes:

- Enumerations: `report_route_status` (COMPLETED, PARTIALLY_COMPLETED, CANCELLED), `report_risk_level` (NONE, LOW, MEDIUM, HIGH).
- Soft-delete columns: `drivers.deleted_at`, `vehicles.deleted_at` (uniqueness enforced only for active records via partial unique indexes).
- RLS: enabled and scoped by `company_uuid` using helper `auth.company_uuid()`; all company-scoped endpoints must pass user JWT so RLS enforces tenancy. Public token flows use service role under controlled logic.

## 2. Endpoints

Conventions:

- Base path: `/api`
- All company-scoped endpoints require Supabase JWT in `Authorization: Bearer <access_token>` unless noted as public.
- Pagination: cursor-based using `?limit=<int>&cursor=<opaque>` when specified; otherwise page-based `?page=<int>&pageSize=<int>`. All list endpoints MUST support `limit` and stable sort (default DESC by creation/time field).
- Sorting: `?sortBy=<field>&sortDir=asc|desc` where applicable; default documented per endpoint.
- Filtering: via explicit query params; avoid ad-hoc `filter` JSON.
- Errors: JSON problem detail with `code`, `message`, optional `details`.

### 2.1 Health

- GET `/api/health`
  - Description: Liveness/probes.
  - Response: `{ status: "ok", time: string }`

### 2.2 Auth/session

Supabase Auth handles sign-in/sign-up. The API does not expose custom auth endpoints. Clients use Supabase SDK to obtain a JWT. All protected endpoints rely on RLS via the JWT. Public token flows are implemented with service-role on the server side with additional checks.

### 2.3 Companies

Mostly single-tenant (one company), but keep REST shape.

- GET `/api/companies/me`
  - Description: Return the caller's company (derived from `auth.company_uuid()`).
  - Response:
    ```json
    {
      "uuid": "uuid",
      "name": "string",
      "createdAt": "2025-01-01T00:00:00Z"
    }
    ```
  - Errors: 404 if no company mapped.

- PATCH `/api/companies/me`
  - Body:
    ```json
    { "name": "string" }
    ```
  - Success: 200 updated company.
  - Errors: 400 validation.

### 2.4 Users

- GET `/api/users/me`
  - Description: Return current user profile joined with company.
  - Response:
    ```json
    {
      "uuid": "uuid",
      "companyUuid": "uuid",
      "createdAt": "2025-01-01T00:00:00Z"
    }
    ```

### 2.5 Drivers

- GET `/api/drivers`
  - Description: List drivers for company.
  - Query: `?q=<text>&isActive=true|false&includeDeleted=false&limit=50&cursor=opaque&sortBy=name|createdAt&sortDir=asc|desc`
  - Response:
    ```json
    {
      "items": [
        {
          "uuid": "uuid",
          "name": "string",
          "email": "string",
          "timezone": "Europe/Warsaw",
          "isActive": true,
          "createdAt": "2025-01-01T00:00:00Z",
          "deletedAt": null
        }
      ],
      "nextCursor": "opaque|null"
    }
    ```

- POST `/api/drivers`
  - Body:
    ```json
    {
      "name": "string",
      "email": "string",
      "timezone": "Europe/Warsaw",
      "isActive": true
    }
    ```
  - Success: 201 with created driver.
  - Errors: 409 if (company_uuid, email) duplicates an active driver; 400 invalid timezone; 422 on schema errors.

- GET `/api/drivers/{uuid}` → 200 with driver or 404.

- PATCH `/api/drivers/{uuid}`
  - Body: any subset of POST fields.
  - Success: 200 updated.
  - Errors: 409 email conflict on active; 400 invalid.

- DELETE `/api/drivers/{uuid}`
  - Description: Soft delete (set `deleted_at`), also set `is_active=false`.
  - Success: 204.

### 2.6 Vehicles

- GET `/api/vehicles`
  - Query: `?q=<text>&isActive=true|false&includeDeleted=false&limit&cursor&sortBy=registrationNumber|createdAt&sortDir`

- POST `/api/vehicles`
  - Body:
    ```json
    {
      "registrationNumber": "string",
      "vin": "string|null",
      "isActive": true
    }
    ```
  - Errors: 409 if (company_uuid, registration_number) duplicates an active vehicle.

- GET `/api/vehicles/{uuid}` → 200/404.
- PATCH `/api/vehicles/{uuid}` → 200/409 on unique violation.
- DELETE `/api/vehicles/{uuid}` → soft delete, 204.

### 2.7 Driver–Vehicle Assignments

Business rule: no overlapping date ranges per driver or per vehicle.

- GET `/api/assignments`
  - Query: `?driverUuid=&vehicleUuid=&activeOn=YYYY-MM-DD&limit&cursor&sortBy=startDate|endDate|createdAt&sortDir`
  - Description: Filter by driver, vehicle, or assignments active on a date.

- POST `/api/assignments`
  - Body:
    ```json
    {
      "driverUuid": "uuid",
      "vehicleUuid": "uuid",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD|null"
    }
    ```
  - Success: 201 created.
  - Errors: 409 on overlap (pre-check plus surfacing DB EXCLUDE violation), 400 invalid range (endDate < startDate).

- PATCH `/api/assignments/{uuid}`
  - Body: `{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD|null" }` (any subset)
  - Errors: 409 on overlap.

- DELETE `/api/assignments/{uuid}` → 204 hard delete (historical edits should be rare; consider policy to prevent deleting overlapping past data if needed).

### 2.8 Reports

- GET `/api/reports`
  - Description: List reports with dashboard-centric filters.
  - Query:
    - `?from=YYYY-MM-DD&to=YYYY-MM-DD` (defaults: `today` for both if omitted in dashboard view)
    - `?driverUuid=` (multi allowed)
    - `?riskLevel=NONE|LOW|MEDIUM|HIGH` (multi allowed)
    - `?routeStatus=COMPLETED|PARTIALLY_COMPLETED|CANCELLED`
    - `?q=<full-text>` (uses `reports_search_vector_idx`)
    - `?includeAi=true|false` (join `report_ai_results`)
    - `?limit&cursor&sortBy=reportDate|occurredAt|riskLevel&sortDir`
  - Response: items + nextCursor (each item summarized for card rendering).

- GET `/api/reports/{uuid}`
  - Description: Full report including AI if requested.
  - Query: `?includeAi=true|false&includeTags=true|false`

- POST `/api/reports` (admin path)
  - Description: Manual add/edit by dispatcher (US-013). Uses current user context; `report_date` interpreted in provided timezone.
  - Body:
    ```json
    {
      "driverUuid": "uuid",
      "reportDate": "YYYY-MM-DD",
      "timezone": "Europe/Warsaw",
      "routeStatus": "COMPLETED|PARTIALLY_COMPLETED|CANCELLED",
      "delayMinutes": 0,
      "delayReason": "string|null",
      "cargoDamageDescription": "string|null",
      "vehicleDamageDescription": "string|null",
      "nextDayBlockers": "string|null",
      "isProblem": true,
      "riskLevel": "NONE|LOW|MEDIUM|HIGH|null",
      "tags": ["delay", "damage"]
    }
    ```
  - Success: 201 with created report; AI processing scheduled (see AI endpoints). `riskLevel` may be omitted and later denormalized from AI.
  - Errors: 409 on (driver_uuid, report_date) uniqueness; 400 validation rules (see §4).

- PATCH `/api/reports/{uuid}`
  - Description: Admin edit; triggers AI reprocessing.
  - Body: any subset of POST fields except `driverUuid`.

- DELETE `/api/reports/{uuid}` → 204 (admin only; consider policy to avoid accidental deletion; commonly avoided in production).

- GET `/api/reports/today/summary`
  - Description: Dashboard “Today” aggregation: submitted vs pending per active drivers, risk breakdown.
  - Query: `?includePending=true|false` (default true), `?timezone=Europe/Warsaw` (for local date calculation if needed).

- GET `/api/reports/export`
  - Description: CSV export (US-016).
  - Query: `?from=YYYY-MM-DD&to=YYYY-MM-DD&includeAi=true|false&includeTags=true|false`
  - Response: `text/csv` with filename `reports_<company>_<YYYYMMDD>.csv`.
  - Errors: 400 if date range missing or invalid; 413 if range too large.

### 2.9 AI Results

- GET `/api/reports/{uuid}/ai`
  - Description: Return AI summary and risk for a report.
  - Response:
    ```json
    {
      "reportUuid": "uuid",
      "aiSummary": "string|null",
      "riskLevel": "NONE|LOW|MEDIUM|HIGH",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:05:00Z"
    }
    ```

- POST `/api/reports/{uuid}/ai/reprocess`
  - Description: Request re-run of AI pipeline (queues job; idempotent per payload hash/time window).
  - Success: 202 accepted.

### 2.10 Risk Tags

- GET `/api/risk-tags` → list all tags (global dictionary; no company scope).
- POST `/api/risk-tags` → create new tag (admin-only; optional in MVP).
- DELETE `/api/risk-tags/{id}` → remove tag (admin-only).

- PUT `/api/reports/{uuid}/risk-tags`
  - Description: Replace set of tags for the report.
  - Body:
    ```json
    { "tags": ["delay", "damage"] }
    ```
  - Success: 200 with updated tag list.

### 2.11 Report Links (token flow)

Public user flow for drivers. Tokens are one-time, hashed in DB, expire in 24h. These endpoints run with service-role on the server and never leak privileged credentials to clients.

- POST `/api/report-links:generate`
  - Description: Generate one-time links for all active drivers (FR-03). Intended for scheduled invocation (cron) or manual preview.
  - Body (optional):
    ```json
    { "at": "2025-01-01T20:00:00Z", "dryRun": false, "driverUuids": ["uuid", "uuid"] }
    ```
  - Success: 202 with summary `{ generated: int, skipped: int }`.

- GET `/api/public/report-links/{token}` (PUBLIC)
  - Description: Validate token; return driver display info and form config. Does not reveal PII beyond what’s needed.
  - Response:
    ```json
    {
      "valid": true,
      "driverName": "string",
      "vehicleRegistration": "string|null",
      "expiresAt": "2025-01-01T22:00:00Z",
      "editableUntil": "2025-01-01T21:10:00Z"
    }
    ```
  - Errors: 404 (unknown), 410 (expired), 409 (already used).

- POST `/api/public/report-links/{token}/reports` (PUBLIC)
  - Description: Submit report (US-007, US-008, US-020). Consumes token (sets `used_at`) on success.
  - Body (minimal OK path or full problem path):
    ```json
    {
      "routeStatus": "COMPLETED|PARTIALLY_COMPLETED|CANCELLED",
      "delayMinutes": 0,
      "delayReason": null,
      "cargoDamageDescription": null,
      "vehicleDamageDescription": null,
      "nextDayBlockers": null,
      "timezone": "Europe/Warsaw"
    }
    ```
  - Success: 201 with `{ reportUuid, editableUntil }`.
  - Errors: 400 validation (e.g., partial requires comment; delay>0 requires reason), 404/410/409 like above.

- PATCH `/api/public/reports/{uuid}` (PUBLIC)
  - Description: Allow driver to edit within 10 minutes of initial submission or while `now() <= editableUntil` (US-009). Requires Bearer token equal to original one-time token (persisted in secure session during GET/POST flow) or signed edit token.
  - Body: same schema as submit (partial allowed).
  - Errors: 403 if token not bound; 409 if edit window elapsed.

### 2.12 Telemetry

- POST `/api/telemetry`
  - Description: Ingest anonymous UX telemetry (US-017). Public for report form only; authenticated for app events.
  - Body:
    ```json
    {
      "eventType": "FORM_OPEN|FORM_SUBMIT|...",
      "occurredAt": "2025-01-01T12:00:00Z",
      "metadata": { "durationMs": 12345, "path": "/public/report" },
      "linkUuid": "uuid|null",
      "reportUuid": "uuid|null"
    }
    ```
  - Success: 202 accepted (write-behind permitted).
  - Constraints: metadata must not include PII.

- GET `/api/telemetry`
  - Description: Company-scoped access for aggregated charts (optional in MVP). Query: `?from&to&eventType&bucket=hour|day`.

### 2.13 Email Logs

- GET `/api/email-logs`
  - Description: Company-scoped list for debugging (optional restricted role).
  - Query: `?status=SENT|FAILED&from&to&limit&cursor`.

## 3. Authentication and Authorization

- Mechanism: Supabase Auth JWT in `Authorization: Bearer <token>`; backend creates supabase server client with this JWT to let Row Level Security (RLS) enforce `company_uuid = auth.company_uuid()` across reads/writes.
- Public flows (`/api/public/...`): server uses service-role Supabase client; all operations explicitly validate `report_links` token state (`expires_at`, `used_at`, hash match). Only scoped fields are exposed; writes set `company_uuid`, `driver_uuid` derived from link.
- Roles: MVP assumes single dispatcher account per company. Admin-only endpoints (risk-tags management, email logs) can be behind an additional server-side role check or feature flag.
- Session: Frontend obtains/refreshes JWT via Supabase SDK. Session expiry 24h per PRD.
- CSRF: Not applicable to token APIs used via POST from SPAs with Bearer tokens; for public form, use same-origin pages plus a signed short-lived form token to bind PATCH edits.
- Rate limiting: IP+token bucket for `/api/public/report-links/*` (e.g., 30/min per IP, 5/min per token), and 60/min per user for authenticated APIs. Expose `429 Too Many Requests` with `Retry-After`.
- Input validation: Zod/Valibot schemas on all handlers; early guard clauses; return `400` with details.
- Auditing: Consider basic request logging for critical mutations (create/update/delete) with user UUID.

## 4. Validation and Business Logic

This section lists validation invariants and how the API enforces them.

### Drivers

- email required, unique within company among active drivers. On create/update: pre-check for existing active email; also handle DB partial unique index conflict → return 409 with a helpful message.
- timezone must be valid IANA tz.
- delete performs soft-delete (`deleted_at=now()`, `is_active=false`).

### Vehicles

- registrationNumber required, unique within company among active vehicles. Same 409 strategy.
- soft-delete mirrors drivers.

### Assignments

- `startDate` required; `endDate` optional. If provided, `endDate >= startDate`.
- No overlaps per driver and per vehicle. Pre-validate using a range query; still handle DB EXCLUDE constraint conflict → 409.
- `company_uuid` inferred from caller.

### Reports (admin and public)

- `routeStatus` ∈ {COMPLETED, PARTIALLY_COMPLETED, CANCELLED}.
- `isProblem` derived server-side: true if any of: `delayMinutes>0`, cargo/vehicle damage present, or blockers present; otherwise false. Public body may omit `isProblem`.
- `delayMinutes >= 0`. If `delayMinutes > 0`, `delayReason` required (US-008).
- If `routeStatus = PARTIALLY_COMPLETED`, require an explanatory field: prefer `nextDayBlockers` or an explicit `partialComment` field (if added). For now, validate at least one non-empty descriptive field.
- Uniqueness `(driver_uuid, report_date)`. For duplicates, return 409 with the existing report UUID.
- `reportDate` computed from driver timezone at submission time in public flow; admin flow accepts explicit date.
- Edit window (public PATCH): allowed until `occurred_at + 10 minutes`. Server checks with tolerance; reject with 409 after window.
- Denormalized `riskLevel` on `reports` mirrors `report_ai_results.risk_level` after AI completes. Admin create can set an initial value; AI will overwrite.
- Full-text search: if `q` provided, use `search_vector` (GIN index) across reason/damage/blockers fields.

### Report Links

- Tokens: generate 128-bit random token; store `hashed_token = sha256(token + pepper)`; never store raw token. `expires_at = now() + 24h`.
- Single use: on successful submission, set `used_at = now()`. Subsequent attempts return 409.
- Validation ordering for GET/POST:
  1. not found → 404; 2) expired → 410; 3) used → 409.

### AI Processing

- On report insert/update, enqueue AI job; within ≤30s update `report_ai_results` and denormalized `reports.risk_level`.
- Endpoint `/api/reports/{uuid}/ai` returns current state; `/reprocess` schedules new run.

### Telemetry

- Reject payloads containing obvious PII fields (basic schema allowlist only). Cap `metadata` size (e.g., ≤2 KB). Always store with `occurred_at` and link/report foreign keys when available.

### Export CSV

- Require `from` and `to`. Cap max range (e.g., 31 days) to protect DB.
- CSV includes core fields + AI outputs + tags. Sanitise newlines; UTF-8 with header.

## 5. Error Model

Uniform JSON for errors:

```json
{
  "code": "string",
  "message": "human readable",
  "details": { "field": "problem" }
}
```

Common cases:

- 400 `validation_error`
- 401 `unauthorized`
- 403 `forbidden`
- 404 `not_found`
- 409 `conflict` (uniqueness, overlap, token used)
- 410 `gone` (expired token)
- 413 `payload_too_large`
- 422 `unprocessable_entity` (semantic validation)
- 429 `rate_limited`
- 500 `internal_error`

## 6. Performance & Index Utilization

- Use `reports_company_date_idx` for date range queries and dashboard sorting by `report_date` DESC.
- Use `reports_company_risk_level_idx` to filter by risk.
- Use `reports_search_vector_idx` (GIN) for `q` full-text searches.
- Use partial unique indexes on drivers/vehicles to maintain unique constraints across soft-deletes.
- Add appropriate FKs indexes already listed (e.g., `reports_driver_uuid_idx`) for joins.
- Partitioning: `reports` by `report_date` (annual) and `telemetry_events` by `occurred_at` (monthly)—keeps scans efficient for date-bounded queries.

## 7. Security

- Enforce RLS by always using a Supabase client bound to the caller JWT for company-scoped endpoints. No manual `company_uuid` in request bodies.
- Public endpoints run with service role but require one-time token checks and minimal returns; avoid leaking PII beyond name/vehicle.
- Rate limiting as in §3.
- Input sanitization for text fields; length caps (e.g., 2,000 chars per description field).
- Logging: do not log tokens or PII. Hash tokens with pepper in app config.
- Email: log only status and non-sensitive metadata in `email_logs`.

## 8. Implementation Notes (Astro + Supabase)

- Place handlers in `src/pages/api/**` (Astro). Public endpoints under `src/pages/api/public/**` with CORS limited to app domain.
- Use Supabase server client per request; for public endpoints, instantiate a service-role client on the server only.
- Use Zod for input validation, return early on errors.
- For scheduled generation of links and alert emails, implement via Supabase Edge Functions/cron or external scheduler invoking `/api/report-links:generate` with service credentials.
- Streaming CSV response for large exports.

## 9. Examples (abridged)

### Create Driver (201)

Request:

```json
{
  "name": "Jan Kowalski",
  "email": "jan.k@example.com",
  "timezone": "Europe/Warsaw",
  "isActive": true
}
```

Response:

```json
{
  "uuid": "...",
  "name": "Jan Kowalski",
  "email": "jan.k@example.com",
  "timezone": "Europe/Warsaw",
  "isActive": true,
  "createdAt": "...",
  "deletedAt": null
}
```

### Public Submit Report (201)

Request:

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

Response:

```json
{ "reportUuid": "...", "editableUntil": "..." }
```

---

This plan covers CRUD, business flows, validation, security, and performance, aligned with the provided schema and MVP PRD.
