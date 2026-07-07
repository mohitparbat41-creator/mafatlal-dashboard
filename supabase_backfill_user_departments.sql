-- ============================================================
-- MIL Business Snapshot — backfill user_profiles.department_id (+ roles)
-- STATUS: already applied to the live project on 07-Jul-2026 via the service role,
-- using the exact mapping the product owner confirmed. This file documents that
-- change and lets you reproduce it on another environment. Re-running is safe:
-- every statement only touches rows that still need it.
--
-- Why: the Sales Entry form auto-fills Department from user_profiles.department_id
-- (the "Not Assigned" state was removed). 11 of 13 sales users had department_id
-- = NULL, so they could not submit at all and their history/RLS scoping matched
-- nothing. Rule from the owner: only populate where currently NULL; never
-- overwrite a non-NULL value.
-- ============================================================

-- STEP 1 — PREVIEW (read-only). Confirm the mapping before applying.
select u.email, p.role, p.department_id
from public.user_profiles p
join auth.users u on u.id = p.id
where p.role = 'sales'
order by p.department_id nulls first;

-- STEP 2 — department backfill for SALES users (only where NULL).
-- Mapping is matched from the login email's local part.
update public.user_profiles p set department_id = m.dept
from (
  select u.id,
    case
      when lower(u.email) like 'corporate@%'    then 'D01'  -- Tender & Corporate Services
      when lower(u.email) like 'hygiene@%'       then 'D01'  -- Tender & Corporate Services
      when lower(u.email) like 'digitalinfra@%'  then 'D02'  -- Digital Infrastructure
      when lower(u.email) like 'healthcare@%'    then 'D03'  -- Healthcare
      when lower(u.email) like 'furnishing@%'    then 'D06'  -- Home Furnishing
      when lower(u.email) like 'msdtextile@%'    then 'D07'  -- Traditional Textile
      when lower(u.email) like 'online@%'        then 'D08'  -- Online Business
      when lower(u.email) like 'uniform@%'       then 'D09'  -- Uniform Solutions
      -- ogp@ (D10) and exports@ (D11) were already assigned — not listed here.
      -- miltextile@ is INTENTIONALLY excluded (belongs to the MIL business, not a
      --   sales department); leave it unassigned or disable the login.
      -- test@ is a QA account — leave unassigned.
    end as dept
  from auth.users u
) m
where p.id = m.id
  and p.role = 'sales'
  and p.department_id is null
  and m.dept is not null;

-- STEP 3 — role: ensure the two admin/leadership accounts are Management.
-- (admin@ was previously role 'sales' with no department.)
update public.user_profiles p set role = 'management'
from auth.users u
where u.id = p.id
  and lower(u.email) in ('admin@mafatlal.com', 'vikas.dwivedi@arvindmafatlalgroup.com')
  and coalesce(lower(p.role), '') <> 'management';

-- STEP 4 — VERIFY: every sales user should now have a department; only the QA
-- 'test' and the intentionally-excluded 'miltextile' logins may remain NULL.
select u.email, p.role, p.department_id
from public.user_profiles p
join auth.users u on u.id = p.id
order by p.role, p.department_id nulls first;
