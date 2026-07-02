'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { submissionsQueryOptions, submitKeys } from '../api/queries';
import { deleteSubmission } from '../api/service';
import { SubmissionRecord, DEPARTMENTS, departmentHead } from '../api/types';
import { SubmitForm } from './submit-form';
import { useAuth } from '@/components/providers/supabase-auth-provider';
import { formatINR } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SubmissionHistory() {
  const { role } = useAuth();
  // Sales can edit/delete their own department; management is read-only.
  const canEdit = role === 'sales';
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(submissionsQueryOptions());

  const [search, setSearch] = useState('');
  const [weekFilter, setWeekFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  // Department filter is management-only (sales are already scoped to one dept by RLS).
  const [deptFilter, setDeptFilter] = useState('all');
  const isManagement = role === 'management';

  const [editRecord, setEditRecord] = useState<SubmissionRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<SubmissionRecord | null>(null);

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submitKeys.submissions() });
      toast.success('Submission deleted');
      setDeleteRecord(null);
    },
    onError: (e: any) => toast.error('Delete failed', { description: e?.message })
  });

  const weeks = useMemo(() => {
    const set = new Set<number>();
    (data || []).forEach((r) => {
      if (r.week_number) set.add(r.week_number);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data || [];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.department_name.toLowerCase().includes(q) ||
          (r.user_email || '').toLowerCase().includes(q) ||
          (r.remarks || '').toLowerCase().includes(q)
      );
    }
    if (weekFilter !== 'all') {
      rows = rows.filter((r) => String(r.week_number) === weekFilter);
    }
    if (dateFilter) {
      rows = rows.filter((r) => (r.timestamp || '').slice(0, 10) === dateFilter);
    }
    // Management-only department filter (sales never see this control).
    if (isManagement && deptFilter !== 'all') {
      rows = rows.filter((r) => r.department_id === deptFilter);
    }
    return rows;
  }, [data, search, weekFilter, dateFilter, deptFilter, isManagement]);

  const hasFilters =
    !!search || weekFilter !== 'all' || !!dateFilter || (isManagement && deptFilter !== 'all');
  const colCount = canEdit ? 9 : 8;

  return (
    <Card className='shadow-sm'>
      <CardHeader className='pb-3'>
        <div className='flex flex-col gap-1'>
          <CardTitle className='text-base font-semibold tracking-tight'>
            Submission History
          </CardTitle>
          <CardDescription className='text-xs'>
            {role === 'management'
              ? 'All departments — read-only'
              : 'Your department — edit or delete your submissions'}
          </CardDescription>
        </div>

        {/* Filters */}
        <div className='flex flex-wrap items-center gap-2 pt-3'>
          <div className='relative'>
            <Icons.search className='text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
            <Input
              placeholder='Search department, user, remarks…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='h-9 w-[240px] pl-8 text-xs'
            />
          </div>
          <Select value={weekFilter} onValueChange={setWeekFilter}>
            <SelectTrigger className='h-9 w-[130px] text-xs'>
              <SelectValue placeholder='Week' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All weeks</SelectItem>
              {weeks.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Week {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isManagement && (
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className='h-9 w-[170px] text-xs'>
                <SelectValue placeholder='Department' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className='flex flex-col leading-tight'>
                      <span>{d.name}</span>
                      <span className='text-[10px] text-muted-foreground'>{d.head}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='h-9 w-[150px] text-xs'
          />
          {hasFilters && (
            <Button
              variant='ghost'
              size='sm'
              className='h-9 text-xs'
              onClick={() => {
                setSearch('');
                setWeekFilter('all');
                setDateFilter('');
                setDeptFilter('all');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='relative max-h-[600px] w-full overflow-auto rounded-lg border'>
          <Table className='w-full text-sm'>
            <TableHeader className='bg-card sticky top-0 z-10'>
              <TableRow className='border-b-2 hover:bg-transparent'>
                <TableHead className='text-xs font-semibold whitespace-nowrap'>
                  Department
                </TableHead>
                <TableHead className='text-xs font-semibold whitespace-nowrap'>Week</TableHead>
                <TableHead className='text-right text-xs font-semibold whitespace-nowrap'>
                  Sales
                </TableHead>
                <TableHead className='text-right text-xs font-semibold whitespace-nowrap'>
                  Collection
                </TableHead>
                <TableHead className='text-right text-xs font-semibold whitespace-nowrap'>
                  Outstanding
                </TableHead>
                <TableHead className='text-xs font-semibold whitespace-nowrap'>Remarks</TableHead>
                <TableHead className='text-xs font-semibold whitespace-nowrap'>
                  Submitted By
                </TableHead>
                <TableHead className='text-xs font-semibold whitespace-nowrap'>Date</TableHead>
                {canEdit && (
                  <TableHead className='text-right text-xs font-semibold whitespace-nowrap'>
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className='h-32 text-center'>
                    <Icons.spinner className='text-muted-foreground mx-auto h-5 w-5 animate-spin' />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className='text-destructive h-32 text-center text-sm'
                  >
                    Failed to load submissions: {(error as any)?.message}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colCount}
                    className='text-muted-foreground h-32 text-center text-sm'
                  >
                    {hasFilters ? 'No submissions match your filters' : 'No submissions yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r, index) => (
                  <TableRow
                    key={r.record_id}
                    className={cn(
                      'hover:bg-muted/50 transition-colors',
                      index % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'
                    )}
                  >
                    <TableCell className='py-2'>
                      <Badge variant='secondary' className='text-[11px] font-medium'>
                        {r.department_name}
                      </Badge>
                      {departmentHead(r.department_name) && (
                        <span className='mt-0.5 block text-[10px] text-muted-foreground'>
                          {departmentHead(r.department_name)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='py-2 text-xs font-medium whitespace-nowrap'>
                      W{r.week_number}
                    </TableCell>
                    <TableCell className='py-2 text-right text-xs tabular-nums whitespace-nowrap'>
                      {formatINR(r.sales_achieved)}
                    </TableCell>
                    <TableCell className='py-2 text-right text-xs tabular-nums whitespace-nowrap'>
                      {formatINR(r.collection_amount)}
                    </TableCell>
                    <TableCell className='py-2 text-right text-xs font-medium tabular-nums whitespace-nowrap'>
                      {formatINR(r.outstanding_amount)}
                    </TableCell>
                    <TableCell className='text-muted-foreground max-w-[200px] truncate py-2 text-xs'>
                      {r.remarks || '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground py-2 text-xs whitespace-nowrap'>
                      {r.user_email?.split('@')[0] || '—'}
                    </TableCell>
                    <TableCell className='text-muted-foreground py-2 text-xs whitespace-nowrap tabular-nums'>
                      {fmtDateTime(r.timestamp)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className='py-2 text-right whitespace-nowrap'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7'
                            aria-label='Edit submission'
                            onClick={() => setEditRecord(r)}
                          >
                            <Icons.edit className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='hover:text-destructive h-7 w-7'
                            aria-label='Delete submission'
                            onClick={() => setDeleteRecord(r)}
                          >
                            <Icons.trash className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && filtered.length > 0 && (
          <p className='text-muted-foreground mt-2 text-[11px]'>
            {filtered.length} submission{filtered.length === 1 ? '' : 's'}
          </p>
        )}
      </CardContent>

      {/* Edit dialog — reuses the submission form preloaded with the record */}
      <Dialog open={!!editRecord} onOpenChange={(open) => !open && setEditRecord(null)}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <SubmitForm
              key={editRecord.record_id}
              editRecord={editRecord}
              onSuccess={() => {
                setEditRecord(null);
                queryClient.invalidateQueries({
                  queryKey: submitKeys.submissions()
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the{' '}
              <span className='text-foreground font-medium'>{deleteRecord?.department_name}</span>{' '}
              submission for{' '}
              <span className='text-foreground font-medium'>Week {deleteRecord?.week_number}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => deleteRecord && removeMutation.mutate(deleteRecord.record_id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
