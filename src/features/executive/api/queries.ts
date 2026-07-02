import { queryOptions } from '@tanstack/react-query';
import {
  fetchExecutiveSummary,
  fetchPendingSubmissions,
  fetchRecentRemarks,
  checkSupabaseHealth
} from './service';

export const executiveKeys = {
  all: ['executive'] as const,
  summary: (departmentFilter: string | null) =>
    [...executiveKeys.all, 'summary', departmentFilter] as const,
  pending: () => [...executiveKeys.all, 'pending'] as const,
  remarks: () => [...executiveKeys.all, 'remarks'] as const,
  health: () => [...executiveKeys.all, 'health'] as const
};

export const executiveSummaryQueryOptions = (departmentFilter: string | null) => {
  return queryOptions({
    queryKey: executiveKeys.summary(departmentFilter),
    queryFn: () => fetchExecutiveSummary(departmentFilter)
  });
};

export const pendingSubmissionsQueryOptions = () => {
  return queryOptions({
    queryKey: executiveKeys.pending(),
    queryFn: () => fetchPendingSubmissions()
  });
};

export const recentRemarksQueryOptions = () => {
  return queryOptions({
    queryKey: executiveKeys.remarks(),
    queryFn: () => fetchRecentRemarks(),
    staleTime: 60_000
  });
};

export const supabaseHealthQueryOptions = () => {
  return queryOptions({
    queryKey: executiveKeys.health(),
    queryFn: () => checkSupabaseHealth(),
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: false
  });
};
