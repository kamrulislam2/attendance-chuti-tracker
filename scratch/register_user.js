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
  const testUsername = 'TESTUSER_' + Math.floor(Math.random() * 1000);
  const testEmail = `${testUsername.toLowerCase()}@gmail.com`;
  const testPassword = 'Password123!';
  
  console.log(`Registering user with email: ${testEmail}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: testUsername,
        role: 'user',
        full_name: 'Test Onboarding User',
        needs_supervisor_approval: true,
        allow_reserve: false,
        allow_overtime: false
      }
    }
  });
  
  if (error) {
    console.error('Registration failed:', error);
    return;
  }
  
  console.log('Registration request completed!');
  console.log('User ID:', data.user ? data.user.id : 'N/A');
  console.log('Session active:', !!data.session);
  console.log('Identities:', data.user ? data.user.identities : []);
  
  if (data.session) {
    console.log('Email confirmation is disabled! We logged in automatically.');
  } else {
    console.log('Email confirmation is enabled. Try logging in to see if it works without confirmation.');
    const { data: logData, error: logError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (logError) {
      console.log('Login failed:', logError.message);
    } else {
      console.log('Login succeeded! Session user ID:', logData.user.id);
    }
  }
}

main().catch(err => console.error(err));
