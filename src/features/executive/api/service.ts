import { createClient } from '@/utils/supabase/client';
import { ExecutiveSummaryRow, PendingSubmission, RemarkEntry, HealthStatus } from './types';
import { DEPARTMENTS } from '@/features/submit/api/types';

export async function fetchExecutiveSummary(
  departmentFilter: string | null
): Promise<ExecutiveSummaryRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('v_executive_summary')
    .select('*')
    .order('week_number', { ascending: true });

  if (departmentFilter && departmentFilter !== 'All') {
    query = query.eq('department_name', departmentFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching executive summary:', error);
    throw new Error(error.message);
  }

  return (data || []) as ExecutiveSummaryRow[];
}

export async function fetchPendingSubmissions(): Promise<PendingSubmission[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_submissions')
    .select('*')
    .eq('status', 'Pending')
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching pending submissions:', error);
    throw new Error(error.message);
  }

  return (data || []) as PendingSubmission[];
}

export async function approveSubmission(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('sales_submissions')
    .update({ status: 'Approved' })
    .eq('record_id', recordId);

  if (error) {
    console.error('Error approving submission:', error);
    throw new Error(error.message);
  }
}

export async function sendBroadcastMessage(message: string): Promise<void> {
  const supabase = createClient();

  // First, deactivate all existing active notifications
  await supabase.from('system_notifications').update({ is_active: false }).eq('is_active', true);

  // Then insert the new one
  const { error } = await supabase
    .from('system_notifications')
    .insert([{ message, is_active: true }]);

  if (error) {
    console.error('Error sending broadcast:', error);
    throw new Error(error.message);
  }
}

// ── Read-only additions for the dashboard polish pass ──────────────────────

// weekly_target_id is `W_<dept>_<weekNN>` → extract the week number.
const weekFromTargetId = (id: string): number => {
  const m = String(id || '').match(/_(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
};

/** Latest non-empty remarks across departments (read-only). */
export async function fetchRecentRemarks(): Promise<RemarkEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales_submissions')
    .select('record_id, department_id, weekly_target_id, user_email, remarks, timestamp')
    .not('remarks', 'is', null)
    .neq('remarks', '')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching remarks:', error);
    throw new Error(error.message);
  }

  const deptName = new Map(DEPARTMENTS.map((d) => [d.id, d.name]));
  return (data || []).map((row: any) => ({
    record_id: row.record_id,
    department_id: row.department_id,
    department_name: deptName.get(row.department_id) || row.department_id,
    week_number: weekFromTargetId(row.weekly_target_id),
    user_email: row.user_email || '',
    remarks: row.remarks,
    timestamp: row.timestamp
  }));
}

/** Lightweight Supabase connectivity ping (HEAD count, no rows returned). */
export async function checkSupabaseHealth(): Promise<HealthStatus> {
  const supabase = createClient();
  const start = Date.now();
  const { error } = await supabase
    .from('v_executive_summary')
    .select('weekly_target_id', { head: true, count: 'exact' });
  const latencyMs = Date.now() - start;

  return {
    ok: !error,
    latencyMs,
    checkedAt: new Date().toISOString(),
    error: error?.message
  };
}
