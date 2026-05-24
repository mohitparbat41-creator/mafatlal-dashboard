'use client';

import { useRouter } from 'next/navigation';

// Sign-up is handled on the sign-in page via the "Create an account" button.
// This page simply redirects to sign-in.
export default function SignUpViewPage() {
  const router = useRouter();
  router.push('/auth/sign-in');
  return null;
}
