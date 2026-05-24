import PageContainer from '@/components/layout/page-container';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkspacesPage() {
  return (
    <PageContainer>
      <Card className='rounded-xl border shadow-sm'>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Workspace management is not available in this version.</CardDescription>
        </CardHeader>
      </Card>
    </PageContainer>
  );
}
