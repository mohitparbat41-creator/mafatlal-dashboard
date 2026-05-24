'use client';

/**
 * Navigation filtering based on user role (Supabase-backed)
 *
 * This hook uses the SupabaseAuthProvider to determine the user's role
 * and filter navigation items accordingly.
 *
 * - 'sales' role: only sees items with urls starting with /submit
 * - 'management' role: sees everything
 */

import { useMemo } from 'react';
import { useAuth } from '@/components/providers/supabase-auth-provider';
import type { NavItem, NavGroup } from '@/types';

/**
 * Hook to filter navigation items based on role
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { role } = useAuth();

  const filteredItems = useMemo(() => {
    if (role === 'sales') {
      return items.filter((item) => {
        if (item.url.startsWith('/submit')) return true;
        return false;
      });
    }
    // Management sees everything
    return items;
  }, [items, role]);

  return filteredItems;
}

/**
 * Hook to filter navigation groups based on role
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
