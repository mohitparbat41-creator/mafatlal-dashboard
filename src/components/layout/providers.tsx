'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { SupabaseAuthProvider } from '../providers/supabase-auth-provider';
import QueryProvider from './query-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SupabaseAuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </SupabaseAuthProvider>
      </ActiveThemeProvider>
    </>
  );
}
