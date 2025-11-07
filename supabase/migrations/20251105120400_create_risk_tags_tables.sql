-- migration: create risk tags tables
-- purpose: create risk_tags and report_risk_tags tables for categorizing reports
-- affected: risk_tags, report_risk_tags tables
-- special considerations:
--   - risk_tags stores predefined tags in English
--   - report_risk_tags is a many-to-many junction table
--   - tags can be reused across multiple reports

-- =============================================================================
-- table: risk_tags
-- purpose: dictionary of predefined risk tags
-- notes:
--   - tag_name is stored in English (e.g., "delay", "damage", "mechanical")
--   - tags are reusable across multiple reports
--   - new tags can be added as needed
-- =============================================================================
create table risk_tags (
  id serial primary key,
  tag_name text not null unique
);

-- enable row level security on risk_tags
alter table risk_tags enable row level security;

-- =============================================================================
-- table: report_risk_tags
-- purpose: junction table linking reports to risk tags (many-to-many)
-- notes:
--   - composite primary key ensures each tag can only be assigned once per report
--   - cascading delete removes associations when report or tag is deleted
--   - includes report_date to match composite primary key in reports table
-- =============================================================================
create table report_risk_tags (
  report_uuid uuid not null,
  report_date date not null,
  tag_id int not null references risk_tags(id) on delete cascade,
  primary key (report_uuid, tag_id),
  foreign key (report_uuid, report_date) references reports(uuid, report_date) on delete cascade
);

-- enable row level security on report_risk_tags
alter table report_risk_tags enable row level security;

-- =============================================================================
-- insert predefined risk tags
-- purpose: populate initial set of common risk tags
-- notes: additional tags can be inserted as needed
-- =============================================================================
insert into risk_tags (tag_name) values
  ('delay'),
  ('cargo_damage'),
  ('vehicle_damage'),
  ('mechanical_issue'),
  ('accident'),
  ('weather'),
  ('traffic'),
  ('route_change'),
  ('customer_issue'),
  ('documentation_issue');

