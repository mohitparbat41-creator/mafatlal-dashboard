'use server';

import { createClient } from '@supabase/supabase-js';
import type { UserMutationPayload } from './types';

export async function createUserAction(data: UserMutationPayload) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key is not configured.');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Provide a temporary password since admin user creation requires it or email verification
  const tempPassword = 'User@' + Math.random().toString(36).slice(-8) + '123!';

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      first_name: data.first_name,
      last_name: data.last_name || '',
      role: data.role
    }
  });

  if (authError) {
    console.error('Auth creation error:', authError);
    throw new Error(authError.message);
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([{
      id: userId,
      role: data.role,
      full_name: `${data.first_name} ${data.last_name || ''}`.trim()
    }]);

  if (profileError) {
    console.error('Profile creation error:', profileError);
    // Attempt rollback
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  return { success: true, userId };
}
