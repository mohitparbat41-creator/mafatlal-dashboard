'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pendingSubmissionsQueryOptions, executiveKeys } from '../api/queries';
import { approveSubmission } from '../api/service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Icons } from '@/components/icons';

export function ApprovalTable() {
  const queryClient = useQueryClient();
  const { data: pendingSubmissions, isLoading } = useQuery(pendingSubmissionsQueryOptions());

  const approveMutation = useMutation({
    mutationFn: (recordId: string) => approveSubmission(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
      toast.success('Submission approved', {
        description: 'The matrix will update shortly based on the database view.'
      });
    },
    onError: (error: any) => {
      toast.error('Approval failed', {
        description: error?.message || 'An error occurred during approval.'
      });
    }
  });

  if (isLoading) {
    return (
      <div className='flex h-32 items-center justify-center rounded-lg border border-dashed'>
        <Icons.spinner className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!pendingSubmissions || pendingSubmissions.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/50'>
        <p className='text-sm text-muted-foreground'>No pending submissions.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submission ID</TableHead>
            <TableHead>Target ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead className='text-right'>Sales</TableHead>
            <TableHead className='text-right'>Collection</TableHead>
            <TableHead className='text-right'>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingSubmissions.map((sub) => (
            <TableRow key={sub.record_id}>
              <TableCell className='font-mono text-xs'>{sub.record_id}</TableCell>
              <TableCell className='font-medium'>{sub.weekly_target_id}</TableCell>
              <TableCell>{sub.user_email}</TableCell>
              <TableCell className='text-right'>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sub.sales_achieved)}
              </TableCell>
              <TableCell className='text-right'>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sub.collection_amount)}
              </TableCell>
              <TableCell className='text-right'>
                <Button 
                  size='sm' 
                  onClick={() => approveMutation.mutate(sub.record_id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : <Icons.check className='mr-2 h-4 w-4' />}
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
