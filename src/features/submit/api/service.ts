import { createClient } from '@/utils/supabase/client';
import { MasterTarget, SalesSubmissionFormValues, SubmissionRecord, DEPARTMENTS } from './types';

export async function getTargetsByDepartment(departmentId: string): Promise<MasterTarget[]> {
  if (!departmentId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('master_targets')
    .select('*')
    .eq('department_id', departmentId)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching targets:', error);
    throw new Error(error.message);
  }

  return data as MasterTarget[];
}

export async function submitSalesData(values: SalesSubmissionFormValues): Promise<void> {
  const supabase = createClient();

  // 1. Get the current user to get their email
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Authentication error. Please log in again.');
  }

  const userEmail = user.email;
  if (!userEmail) {
    throw new Error('User email not found.');
  }

  // 2. Insert into sales_submissions
  const { error: insertError } = await supabase.from('sales_submissions').insert({
    weekly_target_id: values.weekly_target_id,
    department_id: values.department_id,
    sales_achieved: parseFloat(values.sales_achieved as string) || 0,
    collection_amount: parseFloat(values.collection_amount as string) || 0,
    outstanding_amount: parseFloat(values.outstanding_amount as string) || 0,
    remarks: values.remarks || '',
    user_email: userEmail
  });

  if (insertError) {
    console.error('Error inserting sales data:', insertError);
    throw new Error(insertError.message);
  }
}

export async function fetchActiveNotification(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('system_notifications')
    .select('message')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching notification:', error);
    return null;
  }

  return data?.message || null;
}

// ── Submission History (read / update / delete) ────────────────────────────
// Visibility & write permissions are enforced by RLS:
//   sales → own department only; management → read-all, no writes.

const weekFromTargetId = (id: string): number => {
  const m = String(id || '').match(/_(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
};

/**
 * Submission history rows. When `departmentId` is given (sales role) the query is
 * scoped server-side to that department — a much smaller payload than the whole
 * table and a defence-in-depth guard that does not depend on RLS being live.
 * `.limit` caps the result so a single navigation never streams the full table.
 */
export async function fetchSubmissions(
  opts: { departmentId?: string } = {}
): Promise<SubmissionRecord[]> {
  const supabase = createClient();
  let query = supabase
    .from('sales_submissions')
    .select(
      'record_id, weekly_target_id, department_id, user_email, sales_achieved, collection_amount, outstanding_amount, remarks, timestamp'
    )
    .order('timestamp', { ascending: false })
    .limit(1000);

  if (opts.departmentId) {
    query = query.eq('department_id', opts.departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching submissions:', error);
    throw new Error(error.message);
  }

  const deptName = new Map(DEPARTMENTS.map((d) => [d.id, d.name]));
  return (data || []).map((r: any) => ({
    record_id: r.record_id,
    weekly_target_id: r.weekly_target_id,
    department_id: r.department_id,
    department_name: deptName.get(r.department_id) || r.department_id,
    week_number: weekFromTargetId(r.weekly_target_id),
    user_email: r.user_email || '',
    sales_achieved: Number(r.sales_achieved) || 0,
    collection_amount: Number(r.collection_amount) || 0,
    outstanding_amount: Number(r.outstanding_amount) || 0,
    remarks: r.remarks,
    timestamp: r.timestamp
  }));
}

/**
 * Week numbers a department has already submitted (for the green week chips).
 * Selects a single column scoped to the department — intentionally cheap, so the
 * Sales Entry form never pulls the full history payload just to colour a dropdown.
 */
export async function fetchSubmittedWeeks(departmentId: string): Promise<number[]> {
  if (!departmentId) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_submissions')
    .select('weekly_target_id')
    .eq('department_id', departmentId)
    .limit(1000);

  if (error) {
    console.error('Error fetching submitted weeks:', error);
    throw new Error(error.message);
  }

  const weeks = new Set<number>();
  (data || []).forEach((r: any) => {
    const w = weekFromTargetId(r.weekly_target_id);
    if (w) weeks.add(w);
  });
  return Array.from(weeks);
}

export async function updateSubmission(
  recordId: string,
  values: Pick<
    SalesSubmissionFormValues,
    'sales_achieved' | 'collection_amount' | 'outstanding_amount' | 'remarks'
  >
): Promise<void> {
  const supabase = createClient();
  // Only the editable fields are sent — department, week and user stay fixed.
  // Server-side RLS additionally blocks editing another department's rows AND any
  // row older than the 3-business-week window (see supabase_migration_restore_rls.sql),
  // so a crafted API call cannot bypass the disabled UI buttons.
  const { error } = await supabase
    .from('sales_submissions')
    .update({
      sales_achieved: parseFloat(values.sales_achieved as string) || 0,
      collection_amount: parseFloat(values.collection_amount as string) || 0,
      outstanding_amount: parseFloat(values.outstanding_amount as string) || 0,
      remarks: values.remarks || ''
    })
    .eq('record_id', recordId);

  if (error) {
    console.error('Error updating submission:', error);
    throw new Error(error.message);
  }
}

export async function deleteSubmission(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('sales_submissions').delete().eq('record_id', recordId);

  if (error) {
    console.error('Error deleting submission:', error);
    throw new Error(error.message);
  }
}
