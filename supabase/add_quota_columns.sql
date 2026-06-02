-- SQL Migration: Add Leave Quotas to Profiles Table
-- Run this query in your Supabase SQL Editor

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS max_full_leaves INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS max_short_leaves INTEGER DEFAULT 15;

COMMENT ON COLUMN public.profiles.max_full_leaves IS 'Annual Full Leave quota limit per staff';
COMMENT ON COLUMN public.profiles.max_short_leaves IS 'Annual/Monthly Short Leave quota limit in hours per staff';
