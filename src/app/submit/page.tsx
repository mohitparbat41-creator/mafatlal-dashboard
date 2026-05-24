import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';
import { SubmitForm } from '@/features/submit/components/submit-form';


export const metadata: Metadata = {
  title: 'Submit Snapshot | MIL Business Snapshot',
  description: 'Submit your daily business snapshot data.'
};

export default function SubmitPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Submit Snapshot</h2>
            <p className='text-muted-foreground text-sm'>
              Enter your business data below.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <Card className='rounded-xl border shadow-sm mt-4'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Sales Entry Form</CardTitle>
              <CardDescription>
                Select your department and week to submit sales and collection figures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmitForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
