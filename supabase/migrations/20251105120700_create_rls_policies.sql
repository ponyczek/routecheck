-- migration: create row level security policies
-- purpose: implement RLS policies to ensure users can only access their company's data
-- affected: all tables with company_uuid column
-- special considerations:
--   - helper function retrieves company_uuid for current authenticated user
--   - granular policies for each operation (select, insert, update, delete)
--   - separate policies for 'anon' and 'authenticated' roles
--   - public access via report links handled through service_role or edge functions

-- =============================================================================
-- helper function: public.get_user_company_uuid()
-- purpose: retrieves the company_uuid for the currently authenticated user
-- notes:
--   - returns null if user is not found or not authenticated
--   - security definer allows function to access users table
--   - used by RLS policies to filter data by company
--   - function is in public schema because we cannot create functions in auth schema
-- =============================================================================
create or replace function public.get_user_company_uuid()
returns uuid as $$
declare
  company_uuid_val uuid;
begin
  select u.company_uuid into company_uuid_val
  from public.users u
  where u.uuid = auth.uid();
  return company_uuid_val;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- RLS policies for companies table
-- purpose: allow users to access their own company data
-- =============================================================================

-- allow authenticated users to select their own company
create policy "authenticated users can select own company"
  on companies for select
  to authenticated
  using (uuid = public.get_user_company_uuid());

-- allow authenticated users to update their own company
create policy "authenticated users can update own company"
  on companies for update
  to authenticated
  using (uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for users table
-- purpose: allow users to access users in their own company
-- =============================================================================

-- allow authenticated users to select users in their company
create policy "authenticated users can select own company users"
  on users for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert users in their company
create policy "authenticated users can insert own company users"
  on users for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update users in their company
create policy "authenticated users can update own company users"
  on users for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete users in their company
create policy "authenticated users can delete own company users"
  on users for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for drivers table
-- purpose: allow users to access drivers in their own company
-- =============================================================================

-- allow authenticated users to select drivers in their company
create policy "authenticated users can select own company drivers"
  on drivers for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert drivers in their company
create policy "authenticated users can insert own company drivers"
  on drivers for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update drivers in their company
create policy "authenticated users can update own company drivers"
  on drivers for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete drivers in their company (soft delete)
create policy "authenticated users can delete own company drivers"
  on drivers for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for vehicles table
-- purpose: allow users to access vehicles in their own company
-- =============================================================================

-- allow authenticated users to select vehicles in their company
create policy "authenticated users can select own company vehicles"
  on vehicles for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert vehicles in their company
create policy "authenticated users can insert own company vehicles"
  on vehicles for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update vehicles in their company
create policy "authenticated users can update own company vehicles"
  on vehicles for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete vehicles in their company (soft delete)
create policy "authenticated users can delete own company vehicles"
  on vehicles for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for driver_vehicle_assignments table
-- purpose: allow users to access assignments in their own company
-- =============================================================================

-- allow authenticated users to select assignments in their company
create policy "authenticated users can select own company assignments"
  on driver_vehicle_assignments for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert assignments in their company
create policy "authenticated users can insert own company assignments"
  on driver_vehicle_assignments for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update assignments in their company
create policy "authenticated users can update own company assignments"
  on driver_vehicle_assignments for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete assignments in their company
create policy "authenticated users can delete own company assignments"
  on driver_vehicle_assignments for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for reports table
-- purpose: allow users to access reports in their own company
-- notes: public access (anon) is intentionally not allowed here
--        report submission should use edge functions with service_role
-- =============================================================================

-- allow authenticated users to select reports in their company
create policy "authenticated users can select own company reports"
  on reports for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert reports in their company
create policy "authenticated users can insert own company reports"
  on reports for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update reports in their company
create policy "authenticated users can update own company reports"
  on reports for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete reports in their company
create policy "authenticated users can delete own company reports"
  on reports for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for report_ai_results table
-- purpose: allow users to access AI results for reports in their own company
-- notes: access is controlled indirectly through reports table relationship
-- =============================================================================

-- allow authenticated users to select AI results for their company's reports
create policy "authenticated users can select own company ai results"
  on report_ai_results for select
  to authenticated
  using (
    exists (
      select 1 from reports r 
      where r.uuid = report_ai_results.report_uuid 
      and r.report_date = report_ai_results.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- allow authenticated users to insert AI results for their company's reports
create policy "authenticated users can insert own company ai results"
  on report_ai_results for insert
  to authenticated
  with check (
    exists (
      select 1 from reports r 
      where r.uuid = report_ai_results.report_uuid 
      and r.report_date = report_ai_results.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- allow authenticated users to update AI results for their company's reports
create policy "authenticated users can update own company ai results"
  on report_ai_results for update
  to authenticated
  using (
    exists (
      select 1 from reports r 
      where r.uuid = report_ai_results.report_uuid 
      and r.report_date = report_ai_results.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- allow authenticated users to delete AI results for their company's reports
create policy "authenticated users can delete own company ai results"
  on report_ai_results for delete
  to authenticated
  using (
    exists (
      select 1 from reports r 
      where r.uuid = report_ai_results.report_uuid 
      and r.report_date = report_ai_results.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- =============================================================================
-- RLS policies for risk_tags table
-- purpose: allow all users to read risk tags (dictionary table)
-- notes: tags are global and not company-specific
-- =============================================================================

-- allow anonymous users to select risk tags (read-only)
create policy "anonymous users can select risk tags"
  on risk_tags for select
  to anon
  using (true);

-- allow authenticated users to select risk tags
create policy "authenticated users can select risk tags"
  on risk_tags for select
  to authenticated
  using (true);

-- allow authenticated users to insert new risk tags
create policy "authenticated users can insert risk tags"
  on risk_tags for insert
  to authenticated
  with check (true);

-- allow authenticated users to update risk tags
create policy "authenticated users can update risk tags"
  on risk_tags for update
  to authenticated
  using (true);

-- allow authenticated users to delete risk tags
create policy "authenticated users can delete risk tags"
  on risk_tags for delete
  to authenticated
  using (true);

-- =============================================================================
-- RLS policies for report_risk_tags table
-- purpose: allow users to access risk tag assignments for their company's reports
-- notes: access is controlled indirectly through reports table relationship
-- =============================================================================

-- allow authenticated users to select risk tags for their company's reports
create policy "authenticated users can select own company report tags"
  on report_risk_tags for select
  to authenticated
  using (
    exists (
      select 1 from reports r 
      where r.uuid = report_risk_tags.report_uuid 
      and r.report_date = report_risk_tags.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- allow authenticated users to insert risk tags for their company's reports
create policy "authenticated users can insert own company report tags"
  on report_risk_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from reports r 
      where r.uuid = report_risk_tags.report_uuid 
      and r.report_date = report_risk_tags.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- allow authenticated users to delete risk tags for their company's reports
create policy "authenticated users can delete own company report tags"
  on report_risk_tags for delete
  to authenticated
  using (
    exists (
      select 1 from reports r 
      where r.uuid = report_risk_tags.report_uuid 
      and r.report_date = report_risk_tags.report_date
      and r.company_uuid = public.get_user_company_uuid()
    )
  );

-- =============================================================================
-- RLS policies for report_links table
-- purpose: allow users to access report links for their own company
-- notes: public access for validating links should use edge functions
-- =============================================================================

-- allow authenticated users to select links in their company
create policy "authenticated users can select own company links"
  on report_links for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to insert links in their company
create policy "authenticated users can insert own company links"
  on report_links for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to update links in their company
create policy "authenticated users can update own company links"
  on report_links for update
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- allow authenticated users to delete links in their company
create policy "authenticated users can delete own company links"
  on report_links for delete
  to authenticated
  using (company_uuid = public.get_user_company_uuid());

-- =============================================================================
-- RLS policies for telemetry_events table
-- purpose: allow users to access telemetry events for their own company
-- notes: company_uuid may be null for some events
-- =============================================================================

-- allow authenticated users to select events in their company
create policy "authenticated users can select own company events"
  on telemetry_events for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid() or company_uuid is null);

-- allow authenticated users to insert events in their company
create policy "authenticated users can insert own company events"
  on telemetry_events for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid() or company_uuid is null);

-- allow anonymous users to insert telemetry events (for tracking report form usage)
create policy "anonymous users can insert telemetry events"
  on telemetry_events for insert
  to anon
  with check (true);

-- =============================================================================
-- RLS policies for email_logs table
-- purpose: allow users to access email logs for their own company
-- notes: company_uuid may be null for system emails
-- =============================================================================

-- allow authenticated users to select email logs in their company
create policy "authenticated users can select own company email logs"
  on email_logs for select
  to authenticated
  using (company_uuid = public.get_user_company_uuid() or company_uuid is null);

-- allow authenticated users to insert email logs in their company
create policy "authenticated users can insert own company email logs"
  on email_logs for insert
  to authenticated
  with check (company_uuid = public.get_user_company_uuid() or company_uuid is null);

