import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const keyToUse = serviceKey || anonKey || '';
  const supabase = createClient(url || '', keyToUse);
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');

  const result = {
    hasServiceKey: !!serviceKey,
    hasAnonKey: !!anonKey,
    url,
    profilesCount: profiles ? profiles.length : 0,
    profiles,
    error
  };

  const logPath = 'c:/Users/kamru/.gemini/antigravity/scratch/chuti/scratch/db_dump.json';
  fs.writeFileSync(logPath, JSON.stringify(result, null, 2));

  return NextResponse.json(result);
}
