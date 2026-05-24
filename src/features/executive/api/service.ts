import { createClient } from '@/utils/supabase/client';
import { ExecutiveSummaryRow, PendingSubmission } from './types';

export async function fetchExecutiveSummary(departmentFilter: string | null): Promise<ExecutiveSummaryRow[]> {
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
  await supabase
    .from('system_notifications')
    .update({ is_active: false })
    .eq('is_active', true);
    
  // Then insert the new one
  const { error } = await supabase
    .from('system_notifications')
    .insert([{ message, is_active: true }]);

  if (error) {
    console.error('Error sending broadcast:', error);
    throw new Error(error.message);
  }
}
