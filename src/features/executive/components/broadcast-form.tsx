'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendBroadcastMessage } from '../api/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';

export function BroadcastForm() {
  const [message, setMessage] = useState('');

  const broadcastMutation = useMutation({
    mutationFn: (msg: string) => sendBroadcastMessage(msg),
    onSuccess: () => {
      toast.success('Broadcast sent!', {
        description: 'The sales team will see this message immediately.'
      });
      setMessage('');
    },
    onError: (error: any) => {
      toast.error('Failed to send broadcast', {
        description: error?.message || 'An error occurred.'
      });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    broadcastMutation.mutate(message);
  };

  return (
    <div className='rounded-lg border bg-card p-4 space-y-4'>
      <div className='space-y-1'>
        <h3 className='text-base font-semibold tracking-tight'>System Broadcast</h3>
        <p className='text-sm text-muted-foreground'>
          Send a priority notification to the sales team dashboard.
        </p>
      </div>
      <form onSubmit={handleSend} className='flex items-center gap-2'>
        <div className='flex-1'>
          <Label htmlFor='broadcast' className='sr-only'>Message</Label>
          <Input 
            id='broadcast'
            placeholder='Type announcement here...' 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={broadcastMutation.isPending}
          />
        </div>
        <Button 
          type='submit' 
          disabled={!message.trim() || broadcastMutation.isPending}
        >
          {broadcastMutation.isPending ? <Icons.spinner className='mr-2 h-4 w-4 animate-spin' /> : <Icons.send className='mr-2 h-4 w-4' />}
          Broadcast
        </Button>
      </form>
    </div>
  );
}
