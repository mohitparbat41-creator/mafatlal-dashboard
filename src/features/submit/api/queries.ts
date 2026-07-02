import { queryOptions } from '@tanstack/react-query';
import { getTargetsByDepartment, fetchActiveNotification, fetchSubmissions } from './service';

export const submitKeys = {
  all: ['submit'] as const,
  targets: (departmentId: string) => [...submitKeys.all, 'targets', departmentId] as const,
  notification: () => [...submitKeys.all, 'notification'] as const,
  submissions: () => [...submitKeys.all, 'submissions'] as const
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

export const submissionsQueryOptions = () => {
  return queryOptions({
    queryKey: submitKeys.submissions(),
    queryFn: () => fetchSubmissions()
  });
};
