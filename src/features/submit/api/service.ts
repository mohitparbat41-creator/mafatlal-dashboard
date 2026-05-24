import { createClient } from '@/utils/supabase/client';
import { MasterTarget, SalesSubmissionFormValues } from './types';

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
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication error. Please log in again.');
  }
  
  const userEmail = user.email;
  if (!userEmail) {
    throw new Error('User email not found.');
  }

  // 2. Insert into sales_submissions
  const { error: insertError } = await supabase
    .from('sales_submissions')
    .insert({
      weekly_target_id: values.weekly_target_id,
      department_id: values.department_id,
      sales_achieved: parseFloat(values.sales_achieved as string) || 0,
      collection_amount: parseFloat(values.collection_amount as string) || 0,
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
