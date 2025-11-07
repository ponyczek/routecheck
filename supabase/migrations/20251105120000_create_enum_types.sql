-- migration: create enum types
-- purpose: define custom enum types for report status and risk levels
-- affected: report_route_status, report_risk_level enums
-- special considerations: these enums are used across multiple tables

-- create enum for report route status
-- represents the completion status of a driver's route
create type report_route_status as enum (
  'COMPLETED',           -- route was fully completed
  'PARTIALLY_COMPLETED', -- route was only partially completed
  'CANCELLED'            -- route was cancelled
);

-- create enum for report risk level
-- represents the assessed risk level of a report (by AI or manual review)
create type report_risk_level as enum (
  'NONE',   -- no risk identified
  'LOW',    -- low risk situation
  'MEDIUM', -- medium risk requiring attention
  'HIGH'    -- high risk requiring immediate attention
);



