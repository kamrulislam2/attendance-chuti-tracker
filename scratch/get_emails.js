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

async function main() {
  const commonUsernames = [
    'ADMIN', 'KAMRUL', 'SUPERVISOR', 'USER', 'STAFF', 'KI1024',
    'admin', 'kamrul', 'supervisor', 'user', 'staff', 'ki1024',
    'TEST', 'TESTUSER', 'test', 'testuser', 'SYSTEM', 'system'
  ];

  console.log('Resolving emails for common usernames...');
  for (const username of commonUsernames) {
    const { data: email, error } = await supabase.rpc('get_user_email_by_username', {
      p_username: username
    });
    if (error) {
      console.error(`Error resolving ${username}:`, error.message);
    } else if (email) {
      console.log(`Username: ${username} -> Email: ${email}`);
    }
  }
}

main().catch(console.error);
