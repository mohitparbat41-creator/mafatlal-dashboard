import { ExecutiveDashboard } from '@/features/executive/components/executive-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control Tower | MIL Business Snapshot',
  description: 'Executive Management Dashboard for MIL Business Snapshot.'
};

export default function OverViewPage() {
  return (
    <div className='flex flex-1 flex-col space-y-2'>
      <ExecutiveDashboard />
    </div>
  );
}
