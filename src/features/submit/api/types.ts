import { z } from 'zod';

// Canonical department list — the single source of truth for the whole app.
// (IDs D04 and D05 were merged/removed in the DB.) Order: D01, D02, D03, D06–D09.
export const DEPARTMENTS = [
  { id: 'D01', name: 'Tender & Corporate Services', head: 'Akash' },
  { id: 'D02', name: 'Digital Infrastructure', head: 'Jitendra Pradhan' },
  { id: 'D03', name: 'Healthcare', head: 'Jignesh' },
  { id: 'D06', name: 'Home Furnishing', head: 'Prashant' },
  { id: 'D07', name: 'Traditional Textile', head: 'Raju' },
  { id: 'D08', name: 'Online Business', head: 'Sumit' },
  { id: 'D09', name: 'Uniform Solutions', head: 'Varun' }
] as const;

/** Department head for the muted eyebrow label — look up by department name OR id. */
export const departmentHead = (nameOrId: string): string | undefined =>
  DEPARTMENTS.find((d) => d.name === nameOrId || d.id === nameOrId)?.head;

export const salesSubmissionSchema = z.object({
  department_id: z.string().min(1, 'Please select a department.'),
  weekly_target_id: z.string().min(1, 'Please select a week.'),
  sales_achieved: z.string().min(1, 'Sales achieved is required.'),
  collection_amount: z.string().min(1, 'Collection amount is required.'),
  outstanding_amount: z.string().min(1, 'Current outstanding is required.'),
  remarks: z.string().optional()
});

export type SalesSubmissionFormValues = z.infer<typeof salesSubmissionSchema>;

export interface MasterTarget {
  weekly_target_id: string;
  department_id: string;
  department_name: string;
  week_number: number;
  date_range: string;
  created_at: string;
}

export interface SalesSubmission {
  record_id: string;
  weekly_target_id: string;
  timestamp: string;
  user_email: string;
  department_id: string;
  sales_achieved: number;
  collection_amount: number;
  outstanding_amount: number;
  remarks?: string;
}

/** A submission row enriched for the history table (department name + week no.). */
export interface SubmissionRecord {
  record_id: string;
  weekly_target_id: string;
  department_id: string;
  department_name: string;
  week_number: number;
  user_email: string;
  sales_achieved: number;
  collection_amount: number;
  outstanding_amount: number;
  remarks: string | null;
  timestamp: string;
}
