-- ============================================================
-- MIL Business Snapshot — RBAC phase 2 (department lock on INSERT)
-- Run in the Supabase SQL Editor, AFTER supabase_migration_submission_history.sql
-- (which added user_profiles.department_id and the helper functions).
--
-- Goal: a Sales user can INSERT submissions ONLY for their OWN department — even
-- via a crafted API call / tampered request. Management does not submit today but
-- is kept ready. This EXTENDS the role system; it replaces only the INSERT policy.
-- ============================================================

-- Idempotent guards (safe if the earlier migration already ran).
alter table public.user_profiles add column if not exists department_id text;

create or replace function public.current_user_role()
  returns text language sql security definer stable set search_path = ''
  as $$ select role from public.user_profiles where id = auth.uid() $$;

create or replace function public.current_user_dept()
  returns text language sql security definer stable set search_path = ''
  as $$ select department_id from public.user_profiles where id = auth.uid() $$;

-- Replace the old email-only INSERT policy (which allowed inserting for ANY
-- department) with a department-scoped one.
drop policy if exists "Users can insert their own submissions" on public.sales_submissions;

create policy "Insert own submission (dept-scoped for sales)"
  on public.sales_submissions for insert to authenticated
  with check (
    user_email = auth.jwt() ->> 'email'
    and (
      (public.current_user_role() = 'sales' and department_id = public.current_user_dept())
      -- Management does not submit today; ready for the future (any department).
      or public.current_user_role() = 'management'
    )
  );

-- Note: SELECT / UPDATE / DELETE dept-scoping from
-- supabase_migration_submission_history.sql already enforces (server-side, so it
-- holds even against URL/API tampering):
--   • sales       → own department only (view / edit / delete)
--   • management  → read-all, no writes
