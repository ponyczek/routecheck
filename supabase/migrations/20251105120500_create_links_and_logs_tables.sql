-- migration: create report links and logging tables
-- purpose: create report_links, telemetry_events, and email_logs tables
-- affected: report_links, telemetry_events, email_logs tables
-- special considerations:
--   - report_links stores one-time hashed tokens for report submission
--   - telemetry_events is designed for monthly partitioning
--   - email_logs tracks all email communications for monitoring

-- =============================================================================
-- table: report_links
-- purpose: stores one-time, hashed tokens for filling out reports
-- notes:
--   - hashed_token should contain a secure hash of the original token
--   - expires_at defines when the link becomes invalid
--   - used_at is set when the link is used (prevents reuse)
--   - links should be periodically cleaned (e.g., after 90 days)
-- =============================================================================
create table report_links (
  uuid uuid primary key default gen_random_uuid(),
  driver_uuid uuid not null references drivers(uuid) on delete cascade,
  company_uuid uuid not null references companies(uuid) on delete cascade,
  hashed_token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- enable row level security on report_links
alter table report_links enable row level security;

-- =============================================================================
-- table: telemetry_events
-- purpose: collects telemetry data about user interactions
-- notes:
--   - event_type identifies the type of event (e.g., FORM_OPEN, FORM_SUBMIT)
--   - metadata stores additional event-specific data as JSON
--   - foreign keys are optional to allow tracking various event types
--   - designed for monthly partitioning by occurred_at
--   - primary key includes occurred_at because partitioned tables require
--     all unique constraints to include partition key columns
-- =============================================================================
create table telemetry_events (
  uuid uuid not null default gen_random_uuid(),
  event_type text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb,
  link_uuid uuid references report_links(uuid),
  report_uuid uuid,
  report_date date,
  driver_uuid uuid references drivers(uuid),
  company_uuid uuid references companies(uuid),
  primary key (uuid, occurred_at),
  foreign key (report_uuid, report_date) references reports(uuid, report_date)
) partition by range (occurred_at);

-- enable row level security on telemetry_events
alter table telemetry_events enable row level security;

-- =============================================================================
-- create default partition for telemetry_events table
-- purpose: catch-all partition for events that don't match specific partitions
-- notes: specific month partitions should be created as needed
-- =============================================================================
create table telemetry_events_default partition of telemetry_events default;

-- =============================================================================
-- table: email_logs
-- purpose: logs sent emails for monitoring and debugging
-- notes:
--   - recipient stores the email address
--   - status indicates success or failure (e.g., SENT, FAILED)
--   - error_message stores any error details for failed emails
--   - sent_at records when the email was sent
-- =============================================================================
create table email_logs (
  uuid uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  status text not null,
  error_message text,
  sent_at timestamptz not null default now(),
  company_uuid uuid references companies(uuid)
);

-- enable row level security on email_logs
alter table email_logs enable row level security;

