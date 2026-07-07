'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { submitSalesData, updateSubmission } from '../api/service';
import { submittedWeeksQueryOptions, submitKeys } from '../api/queries';
import { FISCAL_WEEKS, getCurrentWeekNumber } from '../api/weeks';
import { useAuth } from '@/components/providers/supabase-auth-provider';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { IndianNumberInput } from './indian-number-input';

import {
  salesSubmissionSchema,
  SalesSubmissionFormValues,
  DEPARTMENTS,
  SubmissionRecord
} from '../api/types';

const deptName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.name ?? id;

/** Status chip for a week option: red = due (past/current, not submitted), green = submitted, grey = future. */
function WeekOption({
  label,
  weekNumber,
  currentWeek,
  submitted
}: {
  label: string;
  weekNumber: number;
  currentWeek: number;
  submitted: boolean;
}) {
  const pastOrCurrent = weekNumber <= currentWeek;
  return (
    <span
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-0.5',
        submitted
          ? 'bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200'
          : pastOrCurrent
            ? 'bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200'
            : 'bg-muted text-muted-foreground'
      )}
    >
      <span>{label}</span>
      {submitted && <Icons.check className='h-3.5 w-3.5 shrink-0' />}
    </span>
  );
}

export function SubmitForm({
  editRecord,
  onSuccess
}: {
  editRecord?: SubmissionRecord;
  onSuccess?: () => void;
} = {}) {
  const { role, department, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!editRecord;

  // Sales users can NEVER choose a department — it comes from their profile.
  const salesLocked = role === 'sales';
  const lockedDeptId = isEdit ? editRecord!.department_id : (department ?? '');

  const currentWeek = getCurrentWeekNumber();

  // A sales user whose profile has no department cannot submit for anyone — show a
  // clear blocking state rather than letting the form fail zod validation silently.
  const missingDept = salesLocked && !isEdit && !authLoading && !lockedDeptId;
  // Block submit until the department is actually known (covers the brief auth-
  // loading window too). Without this, clicking during load would fail the hidden
  // department_id validation and the page would just scroll to the (message-less)
  // department field. Never let that happen.
  const submitDisabled = isSubmitting || (salesLocked && !isEdit && (authLoading || !lockedDeptId));

  // Week submission status for the logged-in department (sales only). Cheap query:
  // one column, scoped to the department — not the full history payload.
  const { data: submittedWeekList } = useQuery({
    ...submittedWeeksQueryOptions(lockedDeptId),
    enabled: salesLocked && !isEdit && !!lockedDeptId
  });
  const submittedWeeks = useMemo(
    () => new Set<number>(submittedWeekList ?? []),
    [submittedWeekList]
  );

  const form = useForm<SalesSubmissionFormValues>({
    resolver: zodResolver(salesSubmissionSchema),
    defaultValues: editRecord
      ? {
          department_id: editRecord.department_id,
          weekly_target_id: FISCAL_WEEKS[editRecord.week_number - 1] ?? '',
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
      // Refresh the green "submitted" week chips and any open history list.
      queryClient.invalidateQueries({ queryKey: submitKeys.all });
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
        {/* Department — auto-filled, disabled dropdown for Sales; selectable for Management */}
        {salesLocked ? (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select value={lockedDeptId || undefined} disabled>
              <FormControl>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={authLoading ? 'Loading…' : 'No department assigned'}>
                    {lockedDeptId ? deptName(lockedDeptId) : null}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {lockedDeptId && (
                  <SelectItem value={lockedDeptId}>{deptName(lockedDeptId)}</SelectItem>
                )}
              </SelectContent>
            </Select>
            {missingDept ? (
              <p className='text-destructive text-sm font-medium'>
                No department is linked to your profile, so you can&apos;t submit. Please contact an
                administrator to set your department.
              </p>
            ) : (
              <FormDescription>
                Your department is set from your profile and can&apos;t be changed.
              </FormDescription>
            )}
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
              value={FISCAL_WEEKS[editRecord!.week_number - 1] ?? `Week ${editRecord!.week_number}`}
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
                    {FISCAL_WEEKS.map((weekStr, i) => (
                      <SelectItem key={weekStr} value={weekStr} className='p-1'>
                        <WeekOption
                          label={weekStr}
                          weekNumber={i + 1}
                          currentWeek={currentWeek}
                          submitted={salesLocked && submittedWeeks.has(i + 1)}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the specific week you are submitting data for.{' '}
                  <span className='text-green-700 dark:text-green-400'>Green</span> = already
                  submitted, <span className='text-red-700 dark:text-red-400'>red</span> = due, grey
                  = upcoming.
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
              <FormLabel>Sales (Selected Week)</FormLabel>
              <FormControl>
                <IndianNumberInput
                  placeholder='0'
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormDescription>In full rupees — e.g. 20,00,000.</FormDescription>
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
              <FormLabel>Collection (Selected Week)</FormLabel>
              <FormControl>
                <IndianNumberInput
                  placeholder='0'
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
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
              <FormLabel>Overall Outstanding Till This Week</FormLabel>
              <FormControl>
                <IndianNumberInput
                  placeholder='0'
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
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
              <FormLabel>Remarks</FormLabel>
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
        <Button type='submit' className='w-full' disabled={submitDisabled}>
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
