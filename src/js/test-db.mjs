import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbbppooilwrwvrnbtihy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnBwb29pbHdyd3ZybmJ0aWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDY0MzQsImV4cCI6MjA5NTAyMjQzNH0.oYLuPlg4PuUgspra7BmbiAksN-lB6jrZddTvxTqHoYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching profiles sample...");
  const { data, error } = await supabase.from('profiles').select('*').limit(5);
  if (error) {
    console.error("Error fetching profiles sample:", error);
  } else {
    console.log("Profiles sample:", JSON.stringify(data, null, 2));
  }
}

test();
