import PageContainer from '@/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExclusivePage() {
  return (
    <PageContainer>
      <Card className='rounded-xl border shadow-sm'>
        <CardHeader>
          <CardTitle>Exclusive</CardTitle>
          <CardDescription>This feature is not available in this version.</CardDescription>
        </CardHeader>
      </Card>
    </PageContainer>
  );
}
