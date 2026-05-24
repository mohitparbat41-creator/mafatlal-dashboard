import PageContainer from '@/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeamPage() {
  return (
    <PageContainer>
      <Card className='rounded-xl border shadow-sm'>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>Team management is not available in this version.</CardDescription>
        </CardHeader>
      </Card>
    </PageContainer>
  );
}
