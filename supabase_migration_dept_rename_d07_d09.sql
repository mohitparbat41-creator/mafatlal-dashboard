-- ============================================================
-- MIL Business Snapshot — fix stale department names in master_targets
-- Run in Supabase SQL Editor (Dashboard → SQL Editor).
--
-- ROOT CAUSE (verified against the live DB on 2026-07-02):
--   master_targets still holds OLD department names for D07 and D09, plus a
--   leftover obsolete D05. The dashboard reads department_name from the view
--   v_executive_summary, which reads it straight from master_targets — so the
--   frontend faithfully shows these stale names. No frontend change is needed;
--   fixing master_targets fixes the view and the dashboard immediately.
--
--     D07  "MSD Traditional Textile"  ->  "Traditional Textile"   (rename)
--     D09  "Uniform Solution"         ->  "Uniform Solutions"     (rename)
--     D05  "MIL Traditional Textile"  ->  (obsolete — should be gone)
-- ============================================================

begin;

-- 1) Rename D07 and D09 to the canonical names.
update public.master_targets
   set department_name = 'Traditional Textile'
 where department_id = 'D07';

update public.master_targets
   set department_name = 'Uniform Solutions'
 where department_id = 'D09';

-- 2) Remove the obsolete D05 department. Safe ONLY because D05 has no
--    submissions (FK is ON DELETE RESTRICT). This guard deletes nothing if any
--    submission references D05 — investigate first in that case.
delete from public.master_targets mt
 where mt.department_id = 'D05'
   and not exists (
     select 1 from public.sales_submissions ss
      where ss.weekly_target_id = mt.weekly_target_id
   );

commit;

-- 3) Verify — every row should now read a canonical name; D05 should be gone.
select department_id, department_name, count(*) as target_rows
  from public.master_targets
 group by department_id, department_name
 order by department_id;
