-- ============================================================
-- MIL Business Snapshot — Submission History module
-- Run in Supabase SQL Editor. This ONLY ADDS to the existing role system —
-- no existing policy is modified or dropped.
--
-- Model (confirmed):
--   • Sales      → see / edit / delete submissions of their OWN department.
--   • Management → see ALL departments, but READ-ONLY (no edit/delete).
-- ============================================================

-- 1) Assign each user a department (sales users belong to one department).
alter table public.user_profiles
  add column if not exists department_id text;
-- Backfill example (run per sales user):
--   update public.user_profiles set department_id = 'D01' where id = '<USER_UUID>';

-- 2) Helper functions (SECURITY DEFINER → read the caller's own profile without
--    RLS recursion). STABLE so the planner can cache within a statement.
create or replace function public.current_user_role()
  returns text language sql security definer stable set search_path = ''
  as $$ select role from public.user_profiles where id = auth.uid() $$;

create or replace function public.current_user_dept()
  returns text language sql security definer stable set search_path = ''
  as $$ select department_id from public.user_profiles where id = auth.uid() $$;

-- 3) NEW, additive RLS policies on sales_submissions.
--    (Existing "read/insert own (by email)" policies remain untouched; policies
--     are OR-combined, so these widen access exactly as specified.)

-- SELECT — sales: own department.
create policy "Sales read own department submissions"
  on public.sales_submissions for select to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
  );

-- SELECT — management: every department (read-only access granted here).
create policy "Management read all submissions"
  on public.sales_submissions for select to authenticated
  using (public.current_user_role() = 'management');

-- UPDATE — sales only, own department. (No management UPDATE policy ⇒ read-only.)
create policy "Sales update own department submissions"
  on public.sales_submissions for update to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
  )
  with check (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
  );

-- DELETE — sales only, own department. (No management DELETE policy ⇒ read-only.)
create policy "Sales delete own department submissions"
  on public.sales_submissions for delete to authenticated
  using (
    public.current_user_role() = 'sales'
    and department_id = public.current_user_dept()
  );
