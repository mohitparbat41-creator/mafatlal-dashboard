'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { submitSalesData, updateSubmission } from '../api/service';
import { useAuth } from '@/components/providers/supabase-auth-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';

import {
  salesSubmissionSchema,
  SalesSubmissionFormValues,
  DEPARTMENTS,
  SubmissionRecord,
  departmentHead
} from '../api/types';
const HARDCODED_WEEKS = [
  'Week 1: 01-Apr to 05-Apr',
  'Week 2: 06-Apr to 12-Apr',
  'Week 3: 13-Apr to 19-Apr',
  'Week 4: 20-Apr to 26-Apr',
  'Week 5: 27-Apr to 03-May',
  'Week 6: 04-May to 10-May',
  'Week 7: 11-May to 17-May',
  'Week 8: 18-May to 24-May',
  'Week 9: 25-May to 31-May',
  'Week 10: 01-Jun to 07-Jun',
  'Week 11: 08-Jun to 14-Jun',
  'Week 12: 15-Jun to 21-Jun',
  'Week 13: 22-Jun to 28-Jun',
  'Week 14: 29-Jun to 05-Jul',
  'Week 15: 06-Jul to 12-Jul',
  'Week 16: 13-Jul to 19-Jul',
  'Week 17: 20-Jul to 26-Jul',
  'Week 18: 27-Jul to 02-Aug',
  'Week 19: 03-Aug to 09-Aug',
  'Week 20: 10-Aug to 16-Aug',
  'Week 21: 17-Aug to 23-Aug',
  'Week 22: 24-Aug to 30-Aug',
  'Week 23: 31-Aug to 06-Sep',
  'Week 24: 07-Sep to 13-Sep',
  'Week 25: 14-Sep to 20-Sep',
  'Week 26: 21-Sep to 27-Sep',
  'Week 27: 28-Sep to 04-Oct',
  'Week 28: 05-Oct to 11-Oct',
  'Week 29: 12-Oct to 18-Oct',
  'Week 30: 19-Oct to 25-Oct',
  'Week 31: 26-Oct to 01-Nov',
  'Week 32: 02-Nov to 08-Nov',
  'Week 33: 09-Nov to 15-Nov',
  'Week 34: 16-Nov to 22-Nov',
  'Week 35: 23-Nov to 29-Nov',
  'Week 36: 30-Nov to 06-Dec',
  'Week 37: 07-Dec to 13-Dec',
  'Week 38: 14-Dec to 20-Dec',
  'Week 39: 21-Dec to 27-Dec',
  'Week 40: 28-Dec to 03-Jan',
  'Week 41: 04-Jan to 10-Jan',
  'Week 42: 11-Jan to 17-Jan',
  'Week 43: 18-Jan to 24-Jan',
  'Week 44: 25-Jan to 31-Jan',
  'Week 45: 01-Feb to 07-Feb',
  'Week 46: 08-Feb to 14-Feb',
  'Week 47: 15-Feb to 21-Feb',
  'Week 48: 22-Feb to 28-Feb',
  'Week 49: 01-Mar to 07-Mar',
  'Week 50: 08-Mar to 14-Mar',
  'Week 51: 15-Mar to 21-Mar',
  'Week 52: 22-Mar to 28-Mar',
  'Week 53: 29-Mar to 31-Mar'
];

const deptName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.name ?? id;

export function SubmitForm({
  editRecord,
  onSuccess
}: {
  editRecord?: SubmissionRecord;
  onSuccess?: () => void;
} = {}) {
  const { role, department } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!editRecord;

  // Sales users can NEVER choose a department — it comes from their profile.
  const salesLocked = role === 'sales';
  const lockedDeptId = isEdit ? editRecord!.department_id : (department ?? '');

  const form = useForm<SalesSubmissionFormValues>({
    resolver: zodResolver(salesSubmissionSchema),
    defaultValues: editRecord
      ? {
          department_id: editRecord.department_id,
          weekly_target_id: HARDCODED_WEEKS[editRecord.week_number - 1] ?? '',
          sales_achieved: String(editRecord.sales_achieved ?? ''),
          collection_amount: String(editRecord.collection_amount ?? ''),
          outstanding_amount: String(editRecord.outstanding_amount ?? ''),
          remarks: editRecord.remarks ?? ''
        }
      : {
          department_id: salesLocked ? (department ?? '') : '',
          weekly_target_id: '',
          sales_achieved: '',
          collection_amount: '',
          outstanding_amount: '',
          remarks: ''
        }
  });

  // Keep a Sales user's department synced to their profile once it loads (create).
  useEffect(() => {
    if (salesLocked && !isEdit && department) {
      form.setValue('department_id', department);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesLocked, isEdit, department]);

  async function onSubmit(data: SalesSubmissionFormValues) {
    setIsSubmitting(true);
    try {
      if (editRecord) {
        // Edit updates ONLY Sales / Collection / Outstanding / Remarks.
        // Department, Week and User stay fixed (never sent to the DB).
        await updateSubmission(editRecord.record_id, {
          sales_achieved: data.sales_achieved,
          collection_amount: data.collection_amount,
          outstanding_amount: data.outstanding_amount,
          remarks: data.remarks
        });
        toast.success('Submission updated', {
          description: 'The record has been updated successfully.'
        });
        onSuccess?.();
        return;
      }

      // Create: for Sales the department comes from the PROFILE, never the browser.
      const deptId = salesLocked ? (department ?? '') : data.department_id;
      if (!deptId) {
        throw new Error('No department is assigned to your profile.');
      }

      const match = data.weekly_target_id.match(/Week (\d+):/);
      if (!match) throw new Error('Invalid week format selected');
      const weekNumberStr = match[1].padStart(2, '0');

      await submitSalesData({
        ...data,
        department_id: deptId,
        weekly_target_id: `W_${deptId}_${weekNumberStr}`
      });
      toast.success('Submission successful!', {
        description: 'Your sales data has been recorded successfully.'
      });
      form.reset({
        department_id: salesLocked ? (department ?? '') : '',
        weekly_target_id: '',
        sales_achieved: '',
        collection_amount: '',
        outstanding_amount: '',
        remarks: ''
      });
    } catch (error: any) {
      toast.error(editRecord ? 'Update failed' : 'Submission failed', {
        description: error?.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* Department — locked badge for Sales; dropdown only for Management */}
        {salesLocked ? (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <div className='space-y-0.5'>
              <Badge variant='secondary' className='px-3 py-1 text-sm font-medium'>
                {lockedDeptId ? deptName(lockedDeptId) : 'Not assigned'}
              </Badge>
              {lockedDeptId && departmentHead(lockedDeptId) && (
                <span className='block text-[11px] text-muted-foreground'>
                  {departmentHead(lockedDeptId)}
                </span>
              )}
            </div>
            <FormDescription>
              Your department is set from your profile and can&apos;t be changed.
            </FormDescription>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name='department_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('weekly_target_id', '');
                  }}
                  defaultValue={field.value}
                  value={field.value}
                  disabled={isEdit}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a department' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <span className='flex flex-col leading-tight'>
                          <span>{dept.name}</span>
                          <span className='text-[10px] text-muted-foreground'>{dept.head}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Week / Date Range — dropdown on create; locked (read-only) on edit */}
        {isEdit ? (
          <FormItem>
            <FormLabel>Week / Date Range</FormLabel>
            <Input
              value={
                HARDCODED_WEEKS[editRecord!.week_number - 1] ?? `Week ${editRecord!.week_number}`
              }
              disabled
              readOnly
            />
            <FormDescription>Week cannot be changed when editing.</FormDescription>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name='weekly_target_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week / Date Range</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a date range' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HARDCODED_WEEKS.map((weekStr) => (
                      <SelectItem key={weekStr} value={weekStr}>
                        {weekStr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the specific week you are submitting data for.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Sales Achieved */}
        <FormField
          control={form.control}
          name='sales_achieved'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sales Achieved</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='0.00'
                  step='0.01'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Collection Amount */}
        <FormField
          control={form.control}
          name='collection_amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Amount</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='0.00'
                  step='0.01'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Current Outstanding */}
        <FormField
          control={form.control}
          name='outstanding_amount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Outstanding</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  placeholder='0'
                  step='0.01'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Enter the latest total outstanding balance from ERP (in rupees).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remarks */}
        <FormField
          control={form.control}
          name='remarks'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Add any additional details or context here...'
                  className='resize-y'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
          {isSubmitting
            ? isEdit
              ? 'Updating...'
              : 'Submitting...'
            : isEdit
              ? 'Update Submission'
              : 'Submit Snapshot'}
        </Button>
      </form>
    </Form>
  );
}
