-- ============================================================
-- MIL Business Snapshot — RESTORE & ENFORCE row-level security on sales_submissions
-- Run in the Supabase SQL Editor. *** PRIORITY 1 SECURITY FIX — run ASAP. ***
--
-- Finding (07-Jul-2026 audit, tested against the live project):
--   • An UNAUTHENTICATED anon-key client can SELECT and INSERT into
--     public.sales_submissions.
--   • A logged-in sales user can read, insert, and UPDATE rows of OTHER
--     departments.
--   • The "3-week edit lock" was UI-only (a disabled button) — trivially
--     bypassable through a crafted API call.
-- So RLS on sales_submissions is disabled or shadowed by a permissive catch-all
-- policy, probably left over from the bulk ERP import.
--
-- This migration is ADDITIVE and reads ONLY existing columns
-- (user_profiles.role, user_profiles.department_id, sales_submissions.*). It does
-- NOT change table structure, the app's routing, or the role model. It restores
-- the documented access model AND adds true server-side enforcement of:
--   • sales  → own department only, for SELECT / INSERT / UPDATE / DELETE
--   • sales  → UPDATE / DELETE only within the latest 3 business weeks
--   • management → read ALL, plus UPDATE (needed by the dashboard "Approve"
--                  action, executive/api/service.ts approveSubmission); no
--                  INSERT/DELETE.
--
-- PREREQUISITE: run the department backfill FIRST (already applied on the live
-- DB on 07-Jul-2026; see supabase_backfill_user_departments.sql) so no sales user
-- is locked out with a NULL department when enforcement turns on.
-- ============================================================

-- STEP 0 — DIAGNOSE (read-only): what is in force right now?
select relrowsecurity as rls_enabled
  from pg_class where oid = 'public.sales_submissions'::regclass;
select policyname, cmd, roles, qual, with_check
  from pg_policies
  where schemaname = 'public' and tablename = 'sales_submissions';

-- STEP 1 — re-enable RLS (no-op if already enabled).
-- Steps 1–4 run in one transaction so a mid-script error rolls everything back
-- (RLS + policies are transactional DDL in Postgres). The table always ends up
-- either fully protected or unchanged — never RLS-on with missing policies.
begin;

alter table public.sales_submissions enable row level security;

-- STEP 2 — drop ALL existing policies (clears any permissive catch-all), then
-- recreate the documented + hardened set below.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'sales_submissions'
  loop
    execute format('drop policy %I on public.sales_submissions', p.policyname);
  end loop;
end $$;

-- STEP 3 — helper functions (SECURITY DEFINER → read the caller's own profile
-- without RLS recursion; STABLE so the planner caches within a statement).
create or replace function public.current_user_role()
  returns text language sql security definer stable set search_path = ''
  as $$ select role from public.user_profiles where id = auth.uid() $$;

create or replace function public.current_user_dept()
  returns text language sql security definer stable set search_path = ''
  as $$ select department_id from public.user_profiles where id = auth.uid() $$;

-- Current business week (1..53) for the Apr→Mar fiscal calendar, matching the
-- app's src/features/submit/api/weeks.ts getCurrentWeekNumber(). Weeks are
-- contiguous, so "the current week" = the highest week whose start date <= today.
create or replace function public.current_business_week()
  returns integer language sql stable set search_path = '' as $$
  with starts(week_no, mm, dd) as (values
    (1,4,1),(2,4,6),(3,4,13),(4,4,20),(5,4,27),
    (6,5,4),(7,5,11),(8,5,18),(9,5,25),
    (10,6,1),(11,6,8),(12,6,15),(13,6,22),(14,6,29),
    (15,7,6),(16,7,13),(17,7,20),(18,7,27),
    (19,8,3),(20,8,10),(21,8,17),(22,8,24),(23,8,31),
    (24,9,7),(25,9,14),(26,9,21),(27,9,28),
    (28,10,5),(29,10,12),(30,10,19),(31,10,26),
    (32,11,2),(33,11,9),(34,11,16),(35,11,23),(36,11,30),
    (37,12,7),(38,12,14),(39,12,21),(40,12,28),
    (41,1,4),(42,1,11),(43,1,18),(44,1,25),
    (45,2,1),(46,2,8),(47,2,15),(48,2,22),
    (49,3,1),(50,3,8),(51,3,15),(52,3,22),(53,3,29)
  ),
  -- Fiscal year starts in the April of: this year if today >= Apr, else last year.
  fy as (
    select case when extract(month from current_date) >= 4
                then extract(year from current_date)::int
                else extract(year from current_date)::int - 1 end as start_year
  ),
  dated as (
    select s.week_no,
      make_date(case when s.mm >= 4 then fy.start_year else fy.start_year + 1 end, s.mm, s.dd) as start_date
    from starts s cross join fy
  )
  select coalesce(max(week_no), 1) from dated where start_date <= current_date;
$$;

-- Week number embedded in weekly_target_id 'W_<dept>_<NN>' (anchored at the end,
-- so the department's own digits are ignored). Returns 0 if unparseable.
create or replace function public.week_from_target(target text)
  returns integer language sql immutable set search_path = '' as $$
  select coalesce((regexp_match(coalesce(target, ''), '_(\d+)$'))[1]::int, 0);
$$;

-- Trailing 3-business-week window (current + 2 prior), matching the app's
-- SALES_WEEK_WINDOW = 3 / isWithinSalesWindow(): week_no > current - 3.
create or replace function public.target_within_sales_window(target text)
  returns boolean language sql stable set search_path = '' as $$
  select public.week_from_target(target) > public.current_business_week() - 3;
$$;

-- STEP 4 — policies (all TO authenticated; anon has no policy ⇒ no access).

-- SELECT — sales: own department only.
create policy "Sales read own department submissions"
  on public.sales_submissions for select to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
  );

-- SELECT — management: every department (dashboard read-all).
create policy "Management read all submissions"
  on public.sales_submissions for select to authenticated
  using (public.current_user_role() = 'management');

-- INSERT — own email AND (sales: own department | management: any).
-- Blocks a crafted request that submits for another department.
create policy "Insert own submission (dept-scoped for sales)"
  on public.sales_submissions for insert to authenticated
  with check (
    user_email = auth.jwt() ->> 'email'
    and (
      (public.current_user_role() = 'sales' and department_id = public.current_user_dept())
      or public.current_user_role() = 'management'
    )
  );

-- UPDATE — sales: own department AND only within the latest 3 business weeks.
-- Older rows become read-only server-side, not just in the UI.
create policy "Sales update own department submissions (3-week window)"
  on public.sales_submissions for update to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
    and public.target_within_sales_window(weekly_target_id)
  )
  with check (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
    and public.target_within_sales_window(weekly_target_id)
  );

-- UPDATE — management: any row (required by the dashboard Approve action, which
-- sets status='Approved'). Management does not insert or delete submissions.
create policy "Management update submissions"
  on public.sales_submissions for update to authenticated
  using (public.current_user_role() = 'management')
  with check (public.current_user_role() = 'management');

-- DELETE — sales: own department AND only within the latest 3 business weeks.
create policy "Sales delete own department submissions (3-week window)"
  on public.sales_submissions for delete to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
    and public.target_within_sales_window(weekly_target_id)
  );

commit;

-- STEP 5 — VERIFY: rerun STEP 0. Expect rls_enabled = true and exactly the six
-- policies above. Spot-check current_business_week() returns the expected week
-- (15 on 07-Jul-2026):
--   select public.current_business_week();
-- Confirm anon is blocked (run with the anon key, no session):
--   select count(*) from public.sales_submissions;  -- should error / return 0 rows
