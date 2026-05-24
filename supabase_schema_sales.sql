-- ============================================================
-- MIL Business Snapshot — Sales Submission Tables Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create master_targets table
create table if not exists public.master_targets (
  weekly_target_id uuid primary key default gen_random_uuid(),
  department_id text not null,
  department_name text not null,
  week_number integer not null,
  date_range text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on master_targets
alter table public.master_targets enable row level security;

-- Policies for master_targets: Anyone logged in can read
create policy "Authenticated users can read master_targets"
  on public.master_targets for select
  to authenticated
  using (true);

-- 2. Create sales_submissions table
create table if not exists public.sales_submissions (
  record_id uuid primary key default gen_random_uuid(),
  weekly_target_id uuid references public.master_targets(weekly_target_id) on delete restrict,
  timestamp timestamptz not null default now(),
  user_email text not null,
  department_id text not null,
  sales_achieved numeric not null,
  collection_amount numeric not null,
  remarks text
);

-- Enable RLS on sales_submissions
alter table public.sales_submissions enable row level security;

-- Policies for sales_submissions
-- Users can read their own submissions, management can read all (assuming management check is handled in API or using a robust policy, but for now we'll allow users to insert their own and read their own)
create policy "Users can insert their own submissions"
  on public.sales_submissions for insert
  to authenticated
  with check (user_email = auth.jwt() ->> 'email');

create policy "Users can read their own submissions"
  on public.sales_submissions for select
  to authenticated
  using (user_email = auth.jwt() ->> 'email');

-- Add some dummy data to master_targets for testing (Optional)
insert into public.master_targets (department_id, department_name, week_number, date_range)
values 
  ('D01', 'Corporate', 1, 'Jan 01 - Jan 07'),
  ('D01', 'Corporate', 2, 'Jan 08 - Jan 14'),
  ('D02', 'Digital Infrastructure', 1, 'Jan 01 - Jan 07'),
  ('D03', 'Healthcare', 1, 'Jan 01 - Jan 07')
on conflict do nothing;
