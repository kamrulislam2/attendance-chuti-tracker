-- ============================================================
-- Push Subscriptions Table & Policies for Web Push Notifications
-- Run this SQL in the Supabase SQL Editor after running schema.sql
-- ============================================================

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to INSERT their own subscriptions
CREATE POLICY "push_sub_insert_own" 
  ON public.push_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own subscriptions (for checking status)
CREATE POLICY "push_sub_select_own" 
  ON public.push_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own subscriptions (for unsubscribing)
CREATE POLICY "push_sub_delete_own" 
  ON public.push_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own subscriptions (for re-subscribing)
CREATE POLICY "push_sub_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- SECURITY DEFINER RPC Functions
-- These bypass RLS so the send-push API route can read
-- subscriptions and resolve roles regardless of calling user.
-- ============================================================

-- 1. Get user IDs by role(s) - e.g., find all admin or supervisor IDs
CREATE OR REPLACE FUNCTION public.get_user_ids_by_roles(p_roles TEXT[])
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id
    FROM public.profiles p
    WHERE p.role = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get push subscriptions for specific user IDs
CREATE OR REPLACE FUNCTION public.get_push_subscriptions_for_users(p_user_ids UUID[])
RETURNS TABLE(
  sub_id UUID,
  sub_user_id UUID,
  sub_endpoint TEXT,
  sub_p256dh TEXT,
  sub_auth TEXT
) AS $$
BEGIN
  RETURN QUERY
    SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth
    FROM public.push_subscriptions ps
    WHERE ps.user_id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete a specific push subscription by ID (for cleanup of expired subs)
CREATE OR REPLACE FUNCTION public.delete_push_subscription(p_sub_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.push_subscriptions WHERE id = p_sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Enable Supabase Realtime on chuti and profiles tables
-- This is REQUIRED for real-time dashboard updates without reload
-- ============================================================
-- NOTE: You must also enable Realtime for the 'chuti' and 'profiles'
-- tables in the Supabase Dashboard:
--   Dashboard → Database → Replication → Enable the "chuti" and "profiles" tables
-- 
-- Alternatively, you can run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.chuti;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
