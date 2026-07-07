'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'management' | 'sales';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  department: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  department: null,
  isLoading: true,
  signOut: async () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();
  // The last user id we fetched a profile for — dedupes the redundant profile
  // reads (initial load fired both getUser() and the INITIAL_SESSION event, and
  // every token refresh re-fetched). We now hit user_profiles once per user.
  const profileForUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const applyProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        profileForUserId.current = null;
        if (active) {
          setRole(null);
          setDepartment(null);
        }
        return;
      }
      if (profileForUserId.current === currentUser.id) return; // already loaded
      profileForUserId.current = currentUser.id;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, department_id')
        .eq('id', currentUser.id)
        .single();

      if (!active) return;
      setRole(((profile?.role as string)?.toLowerCase() as UserRole) || 'sales');
      setDepartment((profile?.department_id as string) ?? null);
    };

    // Initial session.
    const init = async () => {
      const {
        data: { user: currentUser }
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(currentUser);
      await applyProfile(currentUser);
      if (active) setIsLoading(false);
    };
    void init();

    // Subsequent auth changes (sign-in/out, token refresh). The dedupe above
    // means a token refresh for the same user does NOT refetch the profile.
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (!active) return;
      setUser(currentUser);
      await applyProfile(currentUser);
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supabase client is stable
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setDepartment(null);
    window.location.href = '/auth/sign-in';
  };

  return (
    <AuthContext.Provider value={{ user, role, department, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
