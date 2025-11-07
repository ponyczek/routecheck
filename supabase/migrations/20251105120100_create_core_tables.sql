-- migration: create core tables
-- purpose: create companies, users, drivers, and vehicles tables
-- affected: companies, users, drivers, vehicles tables
-- special considerations: 
--   - users table references auth.users from supabase auth
--   - drivers and vehicles use soft delete pattern
--   - all tables have RLS enabled

-- =============================================================================
-- table: companies
-- purpose: stores information about companies (clients)
-- notes: in MVP, only one company is supported
-- =============================================================================
create table companies (
  uuid uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- enable row level security on companies
alter table companies enable row level security;

-- =============================================================================
-- table: users
-- purpose: maps supabase auth users to companies
-- notes: uuid is the same as auth.users(id)
-- =============================================================================
create table users (
  uuid uuid primary key references auth.users(id) on delete cascade,
  company_uuid uuid not null references companies(uuid) on delete cascade,
  created_at timestamptz not null default now()
);

-- enable row level security on users
alter table users enable row level security;

-- =============================================================================
-- table: drivers
-- purpose: stores information about drivers
-- notes: 
--   - uses soft delete pattern via deleted_at column
--   - email must be unique per company (only for active drivers)
--   - timezone stores IANA timezone name (e.g., "Europe/Warsaw")
-- =============================================================================
create table drivers (
  uuid uuid primary key default gen_random_uuid(),
  company_uuid uuid not null references companies(uuid) on delete cascade,
  name text not null,
  email text not null,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ensure email is unique per company (including soft-deleted records)
alter table drivers add constraint drivers_company_email_unique unique (company_uuid, email);

-- enable row level security on drivers
alter table drivers enable row level security;

-- =============================================================================
-- table: vehicles
-- purpose: stores information about vehicles
-- notes: 
--   - uses soft delete pattern via deleted_at column
--   - registration_number must be unique per company (only for active vehicles)
--   - vin is optional
-- =============================================================================
create table vehicles (
  uuid uuid primary key default gen_random_uuid(),
  company_uuid uuid not null references companies(uuid) on delete cascade,
  registration_number text not null,
  vin text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ensure registration number is unique per company (including soft-deleted records)
alter table vehicles add constraint vehicles_company_registration_unique unique (company_uuid, registration_number);

-- enable row level security on vehicles
alter table vehicles enable row level security;



