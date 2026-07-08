import { queryOptions } from '@tanstack/react-query';
import {
  getTargetsByDepartment,
  fetchActiveNotification,
  fetchSubmissions,
  fetchSubmittedWeeks
} from './service';

export const submitKeys = {
  all: ['submit'] as const,
  targets: (departmentId: string) => [...submitKeys.all, 'targets', departmentId] as const,
  notification: () => [...submitKeys.all, 'notification'] as const,
  // Prefix shared by every submissions variant so a single invalidate({ queryKey:
  // submitKeys.submissions() }) refreshes them all regardless of the department arg.
  submissions: () => [...submitKeys.all, 'submissions'] as const,
  submissionsByDept: (departmentId?: string, weeklyTargetIds?: string[]) =>
    [
      ...submitKeys.submissions(),
      departmentId ?? 'all',
      weeklyTargetIds ? weeklyTargetIds.join(',') : 'all-weeks'
    ] as const,
  submittedWeeks: (departmentId?: string) =>
    [...submitKeys.all, 'submitted-weeks', departmentId ?? 'none'] as const
};

export const targetsQueryOptions = (departmentId: string) => {
  return queryOptions({
    queryKey: submitKeys.targets(departmentId),
    queryFn: () => getTargetsByDepartment(departmentId),
    enabled: !!departmentId
  });
};

export const activeNotificationQueryOptions = () => {
  return queryOptions({
    queryKey: submitKeys.notification(),
    queryFn: () => fetchActiveNotification()
  });
};

/**
 * Submission history. Pass the caller's own department for the sales role so the
 * fetch is scoped server-side (smaller payload + defence-in-depth); management
 * passes nothing and reads all. staleTime avoids a refetch when navigating
 * between /submit and /submit/history.
 */
export const submissionsQueryOptions = (departmentId?: string, weeklyTargetIds?: string[]) => {
  return queryOptions({
    queryKey: submitKeys.submissionsByDept(departmentId, weeklyTargetIds),
    queryFn: () => fetchSubmissions({ departmentId, weeklyTargetIds }),
    staleTime: 60_000
  });
};

/**
 * Lightweight list of week numbers a department has already submitted — used only
 * to colour the week dropdown green. Selects a single column (not the full history
 * payload), scoped to the department.
 */
export const submittedWeeksQueryOptions = (departmentId?: string) => {
  return queryOptions({
    queryKey: submitKeys.submittedWeeks(departmentId),
    queryFn: () => fetchSubmittedWeeks(departmentId as string),
    enabled: !!departmentId,
    staleTime: 60_000
  });
};
