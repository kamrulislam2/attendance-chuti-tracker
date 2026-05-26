import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbbppooilwrwvrnbtihy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnBwb29pbHdyd3ZybmJ0aWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDY0MzQsImV4cCI6MjA5NTAyMjQzNH0.oYLuPlg4PuUgspra7BmbiAksN-lB6jrZddTvxTqHoYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.rpc('get_user_email_by_username', { p_username: 'ADMIN' });
  console.log("RPC get_user_email_by_username test:", { data, error });

  // Let's run a generic query if we can or check what RPCs are available, but anon key might not have permissions to query pg_proc.
  // Let's check profiles count/data.
  const { data: pData, error: pError } = await supabase.from('profiles').select('*');
  console.log("Profiles count:", pData?.length, "Error:", pError);
}

test();
