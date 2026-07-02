export interface ExecutiveSummaryRow {
  weekly_target_id: string;
  department_id: string;
  department_name: string;
  week_number: number;
  month: string;
  quarter: string;
  date_range: string;
  weekly_target_amount: number;
  total_sales_achieved: number;
  total_collection_amount: number;
  outstanding_amount: number;
  latest_submission_time: string | null;
}

export interface ProcessedExecutiveRow extends ExecutiveSummaryRow {
  sales_ach_pct: number;
  coll_eff_pct: number;
  cum_target: number;
  cum_sales: number;
  cum_collection: number;
}

export interface PendingSubmission {
  record_id: string;
  weekly_target_id: string;
  department_id: string;
  user_email: string;
  sales_achieved: number;
  collection_amount: number;
  remarks: string | null;
  status: string;
  timestamp: string;
}

export interface SystemNotification {
  id: number;
  message: string;
  created_at: string;
  is_active: boolean;
}

export interface RemarkEntry {
  record_id: string;
  department_id: string;
  department_name: string;
  week_number: number;
  user_email: string;
  remarks: string;
  timestamp: string;
}

export interface HealthStatus {
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}
