-- migration: create indexes and triggers
-- purpose: add performance indexes and automatic triggers for reports full-text search
-- affected: drivers, vehicles, reports, telemetry_events, users tables
-- special considerations:
--   - unique indexes for soft-deleted records (drivers, vehicles)
--   - GIN index for full-text search on reports
--   - trigger to automatically update search_vector on reports
--   - indexes on foreign keys for join performance

-- =============================================================================
-- indexes for soft-delete tables
-- purpose: ensure uniqueness only for active (non-deleted) records
-- =============================================================================

-- ensure email is unique per company for active drivers only
create unique index drivers_active_email_idx 
  on drivers (company_uuid, email) 
  where (deleted_at is null);

-- ensure registration number is unique per company for active vehicles only
create unique index vehicles_active_registration_idx 
  on vehicles (company_uuid, registration_number) 
  where (deleted_at is null);

-- =============================================================================
-- indexes for reports table (dashboard performance)
-- purpose: optimize common dashboard queries filtering by company and date
-- =============================================================================

-- optimize queries filtering by company and sorting by date
create index reports_company_date_idx 
  on reports (company_uuid, report_date desc);

-- optimize queries filtering by company and risk level
create index reports_company_risk_level_idx 
  on reports (company_uuid, risk_level);

-- optimize queries filtering by driver
create index reports_driver_uuid_idx 
  on reports (driver_uuid);

-- =============================================================================
-- full-text search setup for reports
-- purpose: enable searching across report text fields
-- =============================================================================

-- create GIN index for full-text search vector
create index reports_search_vector_idx 
  on reports using gin (search_vector);

-- create trigger to automatically update search_vector on insert or update
-- this trigger combines text from delay_reason, cargo_damage_description,
-- vehicle_damage_description, and next_day_blockers into a searchable vector
create trigger reports_search_vector_update 
  before insert or update on reports
  for each row execute function
  tsvector_update_trigger(
    search_vector, 
    'pg_catalog.english', 
    delay_reason, 
    cargo_damage_description, 
    vehicle_damage_description, 
    next_day_blockers
  );

-- =============================================================================
-- indexes for telemetry_events table
-- purpose: optimize queries filtering by event type and time
-- =============================================================================

-- optimize queries filtering by event type and sorting by time
create index telemetry_events_type_time_idx 
  on telemetry_events (event_type, occurred_at desc);

-- =============================================================================
-- indexes for foreign keys without automatic indexes
-- purpose: improve join performance for foreign key relationships
-- =============================================================================

-- optimize joins on users table
create index users_company_uuid_idx 
  on users (company_uuid);

-- optimize joins on drivers table
create index drivers_company_uuid_idx 
  on drivers (company_uuid);



