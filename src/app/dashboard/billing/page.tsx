import PageContainer from '@/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  return (
    <PageContainer>
      <Card className='rounded-xl border shadow-sm'>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Billing management is not available in this version.</CardDescription>
        </CardHeader>
      </Card>
    </PageContainer>
  );
}
