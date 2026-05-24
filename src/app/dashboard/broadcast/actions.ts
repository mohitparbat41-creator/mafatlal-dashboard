'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function sendBroadcastAction(message: string) {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return { success: false, error: 'Message cannot be empty.' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    );

    // 1. Archive all existing notifications
    const { error: updateError } = await supabase
      .from('system_notifications')
      .update({ is_active: false })
      .eq('is_active', true);

    if (updateError) {
      console.error('Failed to archive existing notifications:', updateError);
      return { success: false, error: 'Failed to archive existing notifications.' };
    }

    // 2. Insert the new notification
    const { error: insertError } = await supabase
      .from('system_notifications')
      .insert({
        message: message.trim(),
        is_active: true
      });

    if (insertError) {
      console.error('Failed to insert new notification:', insertError);
      return { success: false, error: 'Failed to send new broadcast.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Broadcast Action Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
}
