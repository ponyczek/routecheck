-- migration: create assignment tables
-- purpose: create driver_vehicle_assignments table to track driver-vehicle relationships over time
-- affected: driver_vehicle_assignments table
-- special considerations:
--   - uses exclusion constraints to prevent overlapping assignments
--   - requires btree_gist extension for daterange overlap checks
--   - prevents same driver from being assigned to multiple vehicles at same time
--   - prevents same vehicle from being assigned to multiple drivers at same time

-- enable btree_gist extension for exclusion constraints on daterange
create extension if not exists btree_gist;

-- =============================================================================
-- table: driver_vehicle_assignments
-- purpose: tracks which drivers are assigned to which vehicles over time
-- notes:
--   - start_date and end_date define the assignment period
--   - end_date is null for current (ongoing) assignments
--   - exclusion constraints prevent overlapping assignments
-- =============================================================================
create table driver_vehicle_assignments (
  uuid uuid primary key default gen_random_uuid(),
  driver_uuid uuid not null references drivers(uuid),
  vehicle_uuid uuid not null references vehicles(uuid),
  start_date date not null,
  end_date date,
  company_uuid uuid not null references companies(uuid) on delete cascade
);

-- prevent assigning the same driver to multiple vehicles at the same time
-- this exclusion constraint ensures no date overlap for a single driver
alter table driver_vehicle_assignments add constraint driver_assignments_no_overlap 
  exclude using gist (
    driver_uuid with =,
    daterange(start_date, end_date, '[]') with &&
  );

-- prevent assigning the same vehicle to multiple drivers at the same time
-- this exclusion constraint ensures no date overlap for a single vehicle
alter table driver_vehicle_assignments add constraint vehicle_assignments_no_overlap 
  exclude using gist (
    vehicle_uuid with =,
    daterange(start_date, end_date, '[]') with &&
  );

-- enable row level security on driver_vehicle_assignments
alter table driver_vehicle_assignments enable row level security;



