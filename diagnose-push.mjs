import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbbppooilwrwvrnbtihy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYnBwb29pbHdyd3ZybmJ0aWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDY0MzQsImV4cCI6MjA5NTAyMjQzNH0.oYLuPlg4PuUgspra7BmbiAksN-lB6jrZddTvxTqHoYs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('=== PUSH NOTIFICATION DIAGNOSTIC ===\n');

  // 1. Check RPC function: get_user_ids_by_roles for supervisors
  console.log('--- 1. Checking RPC: get_user_ids_by_roles(supervisor) ---');
  const { data: supervisorIds, error: rpcErr1 } = await supabase
    .rpc('get_user_ids_by_roles', { p_roles: ['supervisor'] });
  
  if (rpcErr1) {
    console.error('❌ RPC get_user_ids_by_roles FAILED:', rpcErr1.message);
  } else {
    console.log('✅ Supervisor IDs found:', JSON.stringify(supervisorIds, null, 2));
    console.log('   Count:', supervisorIds?.length || 0);
  }

  // 2. Check RPC function: get_user_ids_by_roles for admins
  console.log('\n--- 2. Checking RPC: get_user_ids_by_roles(admin) ---');
  const { data: adminIds, error: rpcErr2 } = await supabase
    .rpc('get_user_ids_by_roles', { p_roles: ['admin'] });
  
  if (rpcErr2) {
    console.error('❌ RPC get_user_ids_by_roles (admin) FAILED:', rpcErr2.message);
  } else {
    console.log('✅ Admin IDs found:', JSON.stringify(adminIds, null, 2));
    console.log('   Count:', adminIds?.length || 0);
  }

  // 3. Check all push subscriptions in the table (using RPC to bypass RLS)
  const allUserIds = [
    ...(supervisorIds || []).map(r => r.user_id),
    ...(adminIds || []).map(r => r.user_id)
  ];

  if (allUserIds.length > 0) {
    console.log('\n--- 3. Checking push_subscriptions for all admin+supervisor users ---');
    const { data: subs, error: subErr } = await supabase
      .rpc('get_push_subscriptions_for_users', { p_user_ids: allUserIds });

    if (subErr) {
      console.error('❌ RPC get_push_subscriptions_for_users FAILED:', subErr.message);
    } else {
      console.log('✅ Push subscriptions found:', subs?.length || 0);
      if (subs && subs.length > 0) {
        subs.forEach((s, i) => {
          console.log(`   [${i+1}] user_id: ${s.sub_user_id}, endpoint: ${s.sub_endpoint?.substring(0, 60)}...`);
        });
      } else {
        console.log('   ⚠️ NO push subscriptions in database for admin/supervisor users!');
        console.log('   → This means the subscription was NOT saved when they toggled ON.');
      }

      // Check which users have subscriptions
      const subscribedUserIds = new Set(subs?.map(s => s.sub_user_id) || []);
      
      console.log('\n--- 4. Subscription status per user ---');
      for (const sup of (supervisorIds || [])) {
        const has = subscribedUserIds.has(sup.user_id);
        console.log(`   Supervisor ${sup.user_id}: ${has ? '✅ HAS subscription' : '❌ NO subscription'}`);
      }
      for (const adm of (adminIds || [])) {
        const has = subscribedUserIds.has(adm.user_id);
        console.log(`   Admin ${adm.user_id}: ${has ? '✅ HAS subscription' : '❌ NO subscription'}`);
      }
    }
  } else {
    console.log('\n⚠️ No supervisor or admin users found in profiles table!');
  }

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

diagnose().catch(err => console.error('Diagnostic failed:', err));
