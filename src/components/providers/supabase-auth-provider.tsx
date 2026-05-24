'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'management' | 'sales';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signOut: async () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        setRole(((profile?.role as string)?.toLowerCase() as UserRole) || 'sales');
      }

      setIsLoading(false);
    };

    void getSession();

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        setRole(((profile?.role as string)?.toLowerCase() as UserRole) || 'sales');
      } else {
        setRole(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    window.location.href = '/auth/sign-in';
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
