import { z } from 'zod';

export const DEPARTMENTS = [
  { id: 'D01', name: 'Corporate' },
  { id: 'D02', name: 'Digital Infrastructure' },
  { id: 'D03', name: 'Healthcare' },
  { id: 'D04', name: 'Hygiene Institution' },
  { id: 'D05', name: 'MIL Traditional Textile' },
  { id: 'D06', name: 'Home Furnishing' },
  { id: 'D07', name: 'MSD Traditional Textile' },
  { id: 'D08', name: 'Online Business' },
  { id: 'D09', name: 'Uniform Solution' }
] as const;

export const salesSubmissionSchema = z.object({
  department_id: z.string().min(1, 'Please select a department.'),
  weekly_target_id: z.string().min(1, 'Please select a week.'),
  sales_achieved: z.string().min(1, 'Sales achieved is required.'),
  collection_amount: z.string().min(1, 'Collection amount is required.'),
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
  remarks?: string;
}
