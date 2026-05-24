import { queryOptions } from '@tanstack/react-query';
import { fetchExecutiveSummary, fetchPendingSubmissions } from './service';

export const executiveKeys = {
  all: ['executive'] as const,
  summary: (departmentFilter: string | null) => [...executiveKeys.all, 'summary', departmentFilter] as const,
  pending: () => [...executiveKeys.all, 'pending'] as const,
};

export const executiveSummaryQueryOptions = (departmentFilter: string | null) => {
  return queryOptions({
    queryKey: executiveKeys.summary(departmentFilter),
    queryFn: () => fetchExecutiveSummary(departmentFilter),
  });
};

export const pendingSubmissionsQueryOptions = () => {
  return queryOptions({
    queryKey: executiveKeys.pending(),
    queryFn: () => fetchPendingSubmissions(),
  });
};
