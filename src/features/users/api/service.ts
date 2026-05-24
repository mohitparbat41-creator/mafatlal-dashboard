// ============================================================
// User Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Queries (queries.ts) and components import from here — they never change.
//
// Pick your pattern and replace the function bodies below:
//
// 1. Server Actions + ORM (Prisma / Drizzle / Supabase)
//    → Add 'use server' at the top of this file
//    → Call your ORM directly in each function
//
// 2. Route Handlers + ORM
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<UsersResponse>('/users?...')
//    → Replace mock calls in route handlers (src/app/api/users/) with ORM
//
// 3. BFF — Route Handlers proxy to external backend (Laravel, Go, etc.)
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<UsersResponse>('/users?...')
//    → Route handlers proxy requests to your external backend service
//
// 4. Direct external API (frontend-only, no Next.js backend)
//    → const res = await fetch('https://your-api.com/users?...')
//    → return res.json()
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import { createClient } from '@/utils/supabase/client';
import type { UserFilters, UsersResponse, UserMutationPayload } from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const supabase = createClient();
  
  let query = supabase.from('user_profiles').select('*', { count: 'exact' });

  // Optional filters (search by ID or role)
  if (filters.search) {
    query = query.ilike('id', `%${filters.search}%`);
  }
  
  if (filters.roles) {
    const rolesArray = filters.roles.split('.');
    if (rolesArray.length > 0) {
      query = query.in('role', rolesArray);
    }
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;
  
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message);
  }

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Fetched users',
    total_users: count || 0,
    offset,
    limit,
    users: data
  };
}

// These mutations are kept as stubs for now since table is read-only
export async function createUser(data: UserMutationPayload) {
  throw new Error('Not implemented');
}

export async function updateUser(id: string, data: UserMutationPayload) {
  throw new Error('Not implemented');
}

export async function deleteUser(id: string) {
  throw new Error('Not implemented');
}
