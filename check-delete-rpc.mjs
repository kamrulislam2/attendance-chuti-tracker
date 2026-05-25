import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbbppooilwrwvrnbtihy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnBwb29pbHdyd3ZybmJ0aWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDY0MzQsImV4cCI6MjA5NTAyMjQzNH0.oYLuPlg4PuUgspra7BmbiAksN-lB6jrZddTvxTqHoYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Calling delete_user_by_id RPC...");
  const { data, error } = await supabase.rpc('delete_user_by_id', {
    p_user_id: '00000000-0000-0000-0000-000000000000'
  });
  if (error) {
    console.error("RPC Error:", error);
  } else {
    console.log("Success! RPC Result:", data);
  }
}

test();
