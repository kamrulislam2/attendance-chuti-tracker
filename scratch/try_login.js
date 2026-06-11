const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function tryLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return false;
  }
  console.log(`Successfully logged in as ${email} with password: ${password}`);
  console.log('User ID:', data.user.id);
  return true;
}

async function main() {
  const emails = [
    'admin@office.local',
    'admin@admin.chuti',
    'kamrul@admin.chuti',
    'kamrul@office.local'
  ];
  
  const passwords = [
    'admin',
    'password',
    '123456',
    '12345678',
    'kamrul',
    'Office123!'
  ];
  
  for (const email of emails) {
    for (const pw of passwords) {
      const ok = await tryLogin(email, pw);
      if (ok) return;
    }
  }
  console.log('No default credentials matched.');
}

main().catch(err => console.error(err));
