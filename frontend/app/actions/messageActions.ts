'use server';

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server'; // To get userId securely on the server

// Initialize Supabase client with Service Role Key for admin operations
// IMPORTANT: These environment variables must be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const MESSAGE_LIMIT = 25;

export async function checkAndIncrementMessageCount() {
  const { userId } = auth();

  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // Check if user exists and their current count
    let { data: userCountData, error: fetchError } = await supabase
      .from('user_message_counts')
      .select('message_count')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 'Searched item not found'
      console.error('Supabase fetch error:', fetchError);
      return { success: false, error: 'Error fetching message count.' };
    }

    if (!userCountData) { // User does not exist, insert them
      const { error: insertError } = await supabase
        .from('user_message_counts')
        .insert({ user_id: userId, message_count: 1 });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return { success: false, error: 'Error saving message count.' };
      }
      return { success: true, newCount: 1 };
    }

    // User exists, check their count
    if (userCountData.message_count >= MESSAGE_LIMIT) {
      return { success: false, limitReached: true, currentCount: userCountData.message_count };
    }

    // Increment count
    const newCount = userCountData.message_count + 1;
    const { error: updateError } = await supabase
      .from('user_message_counts')
      .update({ message_count: newCount, last_updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return { success: false, error: 'Error updating message count.' };
    }

    return { success: true, newCount };

  } catch (error) {
    console.error('Unexpected error in checkAndIncrementMessageCount:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
