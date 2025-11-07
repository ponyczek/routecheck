-- migration: create reports and ai results tables
-- purpose: create reports and report_ai_results tables for daily driver reports
-- affected: reports, report_ai_results tables
-- special considerations:
--   - reports table is designed for partitioning by report_date (yearly partitions)
--   - risk_level is denormalized from report_ai_results for query performance
--   - search_vector enables full-text search (trigger will be added in indexes migration)
--   - each driver can only submit one report per day (enforced by unique constraint)

-- =============================================================================
-- table: reports
-- purpose: stores daily reports submitted by drivers
-- notes:
--   - report_date is the local date based on driver's timezone
--   - occurred_at is the UTC timestamp of submission
--   - timezone stores the driver's IANA timezone at submission time
--   - is_problem is calculated based on presence of issues
--   - risk_level is denormalized from report_ai_results for performance
--   - search_vector enables full-text search across text fields
--   - designed for yearly partitioning by report_date
--   - primary key includes report_date because partitioned tables require
--     all unique constraints to include partition key columns
-- =============================================================================
create table reports (
  uuid uuid not null default gen_random_uuid(),
  driver_uuid uuid not null references drivers(uuid),
  company_uuid uuid not null references companies(uuid) on delete cascade,
  report_date date not null,
  occurred_at timestamptz not null default now(),
  timezone text not null,
  route_status report_route_status not null,
  delay_minutes int default 0,
  delay_reason text,
  cargo_damage_description text,
  vehicle_damage_description text,
  next_day_blockers text,
  is_problem boolean not null,
  risk_level report_risk_level,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (uuid, report_date)
) partition by range (report_date);

-- ensure each driver can only submit one report per day
-- must include report_date because it's the partition key
alter table reports add constraint reports_driver_date_unique unique (driver_uuid, report_date);

-- enable row level security on reports
alter table reports enable row level security;

-- =============================================================================
-- table: report_ai_results
-- purpose: stores AI analysis results for each report
-- notes:
--   - one-to-one relationship with reports table
--   - ai_summary is generated text summary of the report
--   - risk_level should be copied to reports.risk_level for performance
--   - includes report_date to match composite primary key in reports table
-- =============================================================================
create table report_ai_results (
  report_uuid uuid not null,
  report_date date not null,
  ai_summary text,
  risk_level report_risk_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  primary key (report_uuid, report_date),
  foreign key (report_uuid, report_date) references reports(uuid, report_date) on delete cascade
);

-- enable row level security on report_ai_results
alter table report_ai_results enable row level security;

-- =============================================================================
-- create default partition for reports table
-- purpose: catch-all partition for reports that don't match specific partitions
-- notes: specific year partitions should be created as needed
-- =============================================================================
create table reports_default partition of reports default;

