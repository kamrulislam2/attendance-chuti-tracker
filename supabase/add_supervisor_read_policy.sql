-- =========================================================================
-- SQL Migration: Allow Authenticated Users to Read Supervisor Profiles
-- =========================================================================
--
-- Why: Normal users (role = 'user') need to view supervisor names and codenames
-- to select them as approving supervisors when submitting a leave request.
-- By default, RLS limits users to only viewing their own profile.
-- This policy expands select permission specifically for supervisor profiles.

CREATE POLICY "Allow authenticated users to read supervisor profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (role = 'supervisor');
