'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { sendBroadcastAction } from './actions';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BroadcastPage() {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    startTransition(async () => {
      const result = await sendBroadcastAction(message);
      if (result.success) {
        toast.success('Broadcast sent!', {
          description: 'The sales team will see this message immediately. Old messages have been archived.'
        });
        setMessage('');
      } else {
        toast.error('Failed to send broadcast', {
          description: result.error || 'An unexpected error occurred.'
        });
      }
    });
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Broadcast</h2>
            <p className='text-muted-foreground text-sm'>
              Send a priority notification to the sales team dashboard.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl mt-8">
          <Card className='rounded-xl border shadow-sm'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>System Broadcast</CardTitle>
              <CardDescription>
                When you send a new message, all previous messages will be automatically archived.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className='flex items-end gap-2'>
                <div className='flex-1 space-y-2'>
                  <Label htmlFor='broadcast'>Message</Label>
                  <Input 
                    id='broadcast'
                    placeholder='Type announcement here...' 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isPending}
                    autoComplete="off"
                  />
                </div>
                <Button 
                  type='submit' 
                  disabled={!message.trim() || isPending}
                >
                  {isPending ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : <Icons.send className='mr-2 h-4 w-4' />}
                  Broadcast
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
