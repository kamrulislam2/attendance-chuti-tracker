import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for this API route
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Prioritize service role key for bypassing RLS server-side
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Clean server-side client to execute RPCs bypassing user RLS/scopes
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

// Initialize web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('VAPID public or private key is missing in environmental variables. Web Push will fail.');
} else {
  webpush.setVapidDetails(
    'mailto:admin@office.local',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Simple in-memory storage for rate limiting (storing userId -> timestamp)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds cooldown

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the requester using their Supabase JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('[SendPush] Missing Authorization header');
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a Supabase client with the user's JWT for auth verification only
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('[SendPush] Auth verification failed:', authError?.message || 'No user session');
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Rate limiting check
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(user.id);
    if (lastRequestTime && (now - lastRequestTime < RATE_LIMIT_WINDOW_MS)) {
      console.warn(`[SendPush] Rate limit hit for user ${user.id}`);
      return NextResponse.json({ error: 'Too Many Requests: Please wait 5 seconds between notification requests.' }, { status: 429 });
    }
    rateLimitMap.set(user.id, now);

    console.log(`[SendPush] Authenticated user: ${user.email} (ID: ${user.id})`);

    // 2. Parse request body
    const { userIds, title, body, url, tag } = await request.json();
    console.log('[SendPush] Request body userIds:', userIds);

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Bad Request: Missing or invalid userIds array' }, { status: 400 });
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'Bad Request: Missing title or body' }, { status: 400 });
    }

    // 3. Resolve special keywords like 'admins' or 'supervisors' using clean server client
    let targetUserIds: string[] = userIds.filter((id: string) => id !== 'admins' && id !== 'supervisors');

    const needsAdmins = userIds.includes('admins');
    const needsSupervisors = userIds.includes('supervisors');

    if (needsAdmins || needsSupervisors) {
      const rolesToFetch: string[] = [];
      if (needsAdmins) rolesToFetch.push('admin');
      if (needsSupervisors) rolesToFetch.push('supervisor');

      console.log(`[SendPush] Resolving roles: ${rolesToFetch.join(', ')}`);
      
      // Use clean server client to execute RPC to bypass RLS completely
      const { data: roleUsers, error: roleError } = await supabaseServer
        .rpc('get_user_ids_by_roles', { p_roles: rolesToFetch });

      if (roleError) {
        console.error('[SendPush] Error resolving role-based user IDs:', roleError);
      } else if (roleUsers && roleUsers.length > 0) {
        const ids = roleUsers.map((r: { user_id: string }) => r.user_id);
        console.log(`[SendPush] Resolved user IDs for roles:`, ids);
        targetUserIds = Array.from(new Set([...targetUserIds, ...ids]));
      } else {
        console.log(`[SendPush] No users found with roles:`, rolesToFetch);
      }
    }

    console.log('[SendPush] Final target user IDs:', targetUserIds);

    // If target list resolved to empty, return early
    if (targetUserIds.length === 0) {
      console.log('[SendPush] Resolved target list is empty. Aborting.');
      return NextResponse.json({ success: true, sentCount: 0, message: 'Resolved targets are empty' });
    }

    // 4. Fetch active subscriptions using clean server client
    console.log('[SendPush] Fetching subscriptions for target user IDs...');
    const { data: subscriptions, error: dbError } = await supabaseServer
      .rpc('get_push_subscriptions_for_users', { p_user_ids: targetUserIds });

    if (dbError) {
      console.error('[SendPush] Error fetching push subscriptions:', dbError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    console.log(`[SendPush] Found ${subscriptions?.length || 0} subscriptions in database.`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[SendPush] No subscriptions found. Aborting.');
      return NextResponse.json({ success: true, sentCount: 0, message: 'No active subscriptions found for target users' });
    }

    // 5. Send notifications
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      tag: tag || 'chuti-alert',
    });

    const sendPromises = subscriptions.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.sub_endpoint,
        keys: {
          p256dh: sub.sub_p256dh,
          auth: sub.sub_auth,
        },
      };

      try {
        console.log(`[SendPush] Sending notification to sub ${sub.sub_id} (user: ${sub.sub_user_id})`);
        await webpush.sendNotification(pushSubscription, payload);
        console.log(`[SendPush] Sent successfully to sub ${sub.sub_id}`);
        return { id: sub.sub_id, success: true };
      } catch (err: any) {
        console.warn(`[SendPush] Failed to send push notification to sub ${sub.sub_id}:`, err.message || err);
        
        // Purge subscription if it's expired or gone (404 / 410)
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[SendPush] Purging inactive subscription ${sub.sub_id}`);
          await supabaseServer.rpc('delete_push_subscription', { p_sub_id: sub.sub_id });
        }
        
        return { id: sub.sub_id, success: false, statusCode: err.statusCode };
      }
    });

    const results = await Promise.all(sendPromises);
    const successfulSends = results.filter(r => r.success).length;

    console.log(`[SendPush] Sending completed. Success: ${successfulSends}/${subscriptions.length}`);

    return NextResponse.json({
      success: true,
      sentCount: successfulSends,
      totalCount: subscriptions.length,
    });

  } catch (err: any) {
    console.error('[SendPush] Unexpected error in send-push API route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
