'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import Image from 'next/image';

export default function SignInViewPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    router.push('/');
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'sales'
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(false);
    // For email confirmation flow
    alert('Check your email for a confirmation link, then sign in.');
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Left panel — branding */}
      <div className='relative hidden h-full flex-col bg-zinc-950 p-10 text-white lg:flex dark:border-r dark:border-zinc-800'>
        <div className='absolute inset-0 bg-zinc-950' />
        <div className='relative z-20 flex items-center gap-3 text-lg font-medium'>
          <Image 
            src="/logo.png" 
            alt="Mafatlal Industries Logo" 
            width={200} 
            height={60} 
            className="object-contain" 
            priority
          />
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg leading-relaxed text-zinc-300'>
              &ldquo;A unified platform for real-time business intelligence across all our
              verticals.&rdquo;
            </p>
            <footer className='text-sm text-zinc-500'>MIL Operations</footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel — form */}
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <Card className='mx-auto w-full max-w-sm rounded-xl border shadow-sm'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold tracking-tight'>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='you@mafatlals.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400'>
                  {error}
                </div>
              )}

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading && <Icons.spinner className='mr-2 size-4 animate-spin' />}
                Sign in
              </Button>

              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-card text-muted-foreground px-2'>Or</span>
                </div>
              </div>

              <Button
                type='button'
                variant='outline'
                className='w-full'
                disabled={isLoading}
                onClick={handleSignUp}
              >
                Create an account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
