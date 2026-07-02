import { SubmissionHistory } from '@/features/submit/components/submission-history';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submission History | MIL Business Snapshot',
  description: 'View and manage sales submissions.'
};

export default function SubmissionHistoryPage() {
  return (
    <div className='mx-auto w-full max-w-7xl p-4 md:p-6'>
      <SubmissionHistory />
    </div>
  );
}
