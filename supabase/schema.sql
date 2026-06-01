-- Supabase Database Schema Setup SQL

-- ==========================================
-- Clean-up (Drop existing tables, triggers, and functions to allow clean reruns)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_supervisor();
DROP FUNCTION IF EXISTS public.is_admin_or_supervisor();
DROP FUNCTION IF EXISTS public.get_user_email_by_username(TEXT);
DROP FUNCTION IF EXISTS public.create_new_user(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.delete_user_by_id(UUID);
DROP FUNCTION IF EXISTS public.admin_update_user_credentials(UUID, TEXT, TEXT);
DROP TABLE IF EXISTS public.chuti CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 1. Create Profiles Table (Stores user roles: admin, supervisor, or user)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'supervisor')),
  username_changes INTEGER NOT NULL DEFAULT 0,
  username_request_status TEXT NOT NULL DEFAULT 'none' CHECK (username_request_status IN ('none', 'pending', 'approved')),
  full_name TEXT,
  working_hours NUMERIC DEFAULT 9.5,
  break_time INTEGER DEFAULT 0,
  is_setup_completed BOOLEAN DEFAULT FALSE,
  job_role TEXT,
  requested_full_name TEXT,
  requested_working_hours NUMERIC,
  requested_break_time INTEGER,
  requested_job_role TEXT,
  profile_change_status TEXT NOT NULL DEFAULT 'none' CHECK (profile_change_status IN ('none', 'pending', 'approved', 'rejected')),
  
  -- Default sign-in/out times
  default_sign_in TEXT DEFAULT NULL,
  default_sign_out TEXT DEFAULT NULL,
  requested_default_sign_in TEXT,
  requested_default_sign_out TEXT,
  needs_supervisor_approval BOOLEAN DEFAULT TRUE,
  allow_reserve BOOLEAN DEFAULT FALSE,
  allow_overtime BOOLEAN DEFAULT FALSE,
  has_edited_profile BOOLEAN NOT NULL DEFAULT FALSE,
  has_changed_password BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
-- ==========================================
-- 2. Create Chuti Table
-- ==========================================
CREATE TABLE public.chuti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Short Leave', 'Full Leave', 'Overtime', 'Reserve')),
  adjustment BOOLEAN NOT NULL DEFAULT FALSE,
  adjusted_hour INTERVAL, -- Stores partial adjustment amount if any
  sign_in_time TIME,
  sign_out_time TIME,
  leave_hour INTERVAL, -- Stores calculated time, e.g. "04:30:00"
  reserve_holiday TEXT, -- Holds the custom holiday name
  reserve_adjustment_status TEXT NOT NULL DEFAULT 'none' CHECK (reserve_adjustment_status IN ('none', 'pending', 'approved', 'rejected')),
  status TEXT NOT NULL DEFAULT 'pending_supervisor' CHECK (status IN ('pending_supervisor', 'needs_review', 'approved_by_supervisor', 'approved')),
  admin_edit_request JSONB,
  admin_edit_status TEXT NOT NULL DEFAULT 'none' CHECK (admin_edit_status IN ('none', 'pending', 'approved', 'rejected')),
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  adjust_short_leave BOOLEAN NOT NULL DEFAULT FALSE,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  bulk_id UUID, -- Group identifier for bulk leave submissions
  
  -- Prevent same user from submitting duplicate dates
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Enable RLS on Chuti
ALTER TABLE public.chuti ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Helper Functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'supervisor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to map username to registered email (Used for simplified login)
CREATE OR REPLACE FUNCTION public.get_user_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE UPPER(p.username) = UPPER(p_username);
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to create a new user (admin only)
CREATE OR REPLACE FUNCTION public.create_new_user(
  p_email TEXT, 
  p_password TEXT, 
  p_username TEXT, 
  p_role TEXT, 
  p_full_name TEXT, 
  p_needs_supervisor_approval BOOLEAN DEFAULT FALSE,
  p_allow_reserve BOOLEAN DEFAULT FALSE,
  p_allow_overtime BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_sql TEXT;
  v_cols TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Create user in auth.users
  v_user_id := extensions.uuid_generate_v4();

  -- Base columns that are guaranteed to exist in auth.users
  v_cols := ARRAY['id', 'instance_id', 'email', 'encrypted_password', 'email_confirmed_at', 'created_at', 'updated_at', 'raw_app_meta_data', 'raw_user_meta_data', 'aud', 'role'];

  -- Construct the SQL query dynamically
  v_sql := 'INSERT INTO auth.users (' || array_to_string(v_cols, ', ');

  -- Check and append optional columns if they exist in the schema
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'confirmation_token') THEN
    v_sql := v_sql || ', confirmation_token';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'recovery_token') THEN
    v_sql := v_sql || ', recovery_token';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_new') THEN
    v_sql := v_sql || ', email_change_token_new';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change') THEN
    v_sql := v_sql || ', email_change';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token') THEN
    v_sql := v_sql || ', phone_change_token';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_current') THEN
    v_sql := v_sql || ', email_change_token_current';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token') THEN
    v_sql := v_sql || ', reauthentication_token';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_sso_user') THEN
    v_sql := v_sql || ', is_sso_user';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous') THEN
    v_sql := v_sql || ', is_anonymous';
  END IF;

  v_sql := v_sql || ') VALUES ($1, ''00000000-0000-0000-0000-000000000000'', $2, crypt($3, gen_salt(''bf'')), NOW(), NOW(), NOW(), ''{"provider":"email","providers":["email"]}''::jsonb, $4, ''authenticated'', ''authenticated''';

  -- Append matching value expressions for the optional columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'confirmation_token') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'recovery_token') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_new') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'phone_change_token') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email_change_token_current') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'reauthentication_token') THEN
    v_sql := v_sql || ', ''''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_sso_user') THEN
    v_sql := v_sql || ', false';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'is_anonymous') THEN
    v_sql := v_sql || ', false';
  END IF;

  v_sql := v_sql || ')';

  -- Execute dynamic insert
  EXECUTE v_sql USING 
    v_user_id, 
    p_email, 
    p_password, 
    jsonb_build_object(
      'username', UPPER(p_username), 
      'role', p_role, 
      'full_name', p_full_name, 
      'needs_supervisor_approval', p_needs_supervisor_approval,
      'allow_reserve', p_allow_reserve,
      'allow_overtime', p_allow_overtime
    );

  -- The trigger will create the profile, but we need to update full_name, needs_supervisor_approval, allow_reserve, allow_overtime
  UPDATE public.profiles
  SET full_name = p_full_name,
      needs_supervisor_approval = p_needs_supervisor_approval,
      allow_reserve = p_allow_reserve,
      allow_overtime = p_allow_overtime,
      is_setup_completed = false
  WHERE id = v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to delete a user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete from auth.users (cascade will handle profiles and chuti)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update user credentials (admin only)
CREATE OR REPLACE FUNCTION public.admin_update_user_credentials(
  p_user_id UUID, 
  p_new_username TEXT DEFAULT NULL, 
  p_new_password TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can update credentials';
  END IF;

  -- Update username in profiles if provided
  IF p_new_username IS NOT NULL AND p_new_username != '' THEN
    UPDATE public.profiles SET username = UPPER(p_new_username) WHERE id = p_user_id;
  END IF;

  -- Update password in auth.users if provided
  IF p_new_password IS NOT NULL AND p_new_password != '' THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to bulk insert approved chuti records for a user (admin only)
CREATE OR REPLACE FUNCTION public.admin_insert_chuti_records_bulk(
  p_user_id UUID,
  p_dates DATE[],
  p_leave_type TEXT,
  p_adjustment BOOLEAN,
  p_adjust_short_leave BOOLEAN,
  p_sign_in_time TIME DEFAULT NULL,
  p_sign_out_time TIME DEFAULT NULL,
  p_leave_hour INTERVAL DEFAULT NULL,
  p_reserve_holiday TEXT DEFAULT NULL,
  p_comment TEXT DEFAULT NULL,
  p_bulk_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_date DATE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can insert chuti records for other users';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    INSERT INTO public.chuti (
      user_id,
      date,
      leave_type,
      adjustment,
      adjust_short_leave,
      sign_in_time,
      sign_out_time,
      leave_hour,
      reserve_holiday,
      reserve_adjustment_status,
      status,
      comment,
      bulk_id
    )
    VALUES (
      p_user_id,
      v_date,
      p_leave_type,
      p_adjustment,
      p_adjust_short_leave,
      p_sign_in_time,
      p_sign_out_time,
      p_leave_hour,
      p_reserve_holiday,
      CASE WHEN p_leave_type = 'Reserve' AND p_adjustment THEN 'approved'::TEXT ELSE 'none'::TEXT END,
      'approved', -- Admin added records are auto-approved
      p_comment,
      p_bulk_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. Row Level Security (RLS) Policies
-- ==========================================

-- Profiles Policies
CREATE POLICY "Allow users to read their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow admin/supervisor to read all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin_or_supervisor());

CREATE POLICY "Allow admins to insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Allow users to insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Allow users to update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins to update all profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Allow admins to delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- Role update protection trigger
CREATE OR REPLACE FUNCTION public.check_profile_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'You are not allowed to change your role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_update ON public.profiles;
CREATE TRIGGER on_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_change();

-- Chuti Policies
CREATE POLICY "Allow users to read their own chuti"
ON public.chuti FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow admin/supervisor to read all chuti"
ON public.chuti FOR SELECT
USING (public.is_admin_or_supervisor());

CREATE POLICY "Allow users to insert their own chuti"
ON public.chuti FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admins to insert chuti for all users"
ON public.chuti FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Allow users to update their own chuti"
ON public.chuti FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow supervisors to update chuti status"
ON public.chuti FOR UPDATE
USING (public.is_supervisor());

CREATE POLICY "Allow admins to update all chuti"
ON public.chuti FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Allow users to delete their own chuti"
ON public.chuti FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Allow supervisors to delete chuti"
ON public.chuti FOR DELETE
USING (public.is_supervisor());

CREATE POLICY "Allow admins to delete chuti"
ON public.chuti FOR DELETE
USING (public.is_admin());

-- ==========================================
-- 5. Triggers to automatically create a profile when a new user signs up in Auth.users
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INTEGER := 1;
BEGIN
  base_username := UPPER(COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)));
  final_username := base_username;
  
  -- Loop to find a unique username if it already exists
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || suffix::TEXT;
    suffix := suffix + 1;
  END LOOP;

  -- Insert into public.profiles (id, username, role, needs_supervisor_approval, allow_reserve, allow_overtime)
  INSERT INTO public.profiles (id, username, role, needs_supervisor_approval, allow_reserve, allow_overtime)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      CASE 
        WHEN NEW.email LIKE '%@admin.chuti' OR NEW.email LIKE '%@admin.local' OR NEW.email = 'admin@office.local' THEN 'admin'
        WHEN NEW.email LIKE '%@supervisor.chuti' OR NEW.email LIKE '%@supervisor.local' OR NEW.email = 'supervisor@office.local' THEN 'supervisor'
        ELSE 'user'
      END
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'needs_supervisor_approval')::BOOLEAN,
      CASE 
        WHEN NEW.email LIKE '%@admin.chuti' OR NEW.email LIKE '%@admin.local' OR NEW.email = 'admin@office.local' THEN FALSE
        WHEN NEW.email LIKE '%@supervisor.chuti' OR NEW.email LIKE '%@supervisor.local' OR NEW.email = 'supervisor@office.local' THEN FALSE
        ELSE TRUE
      END
    ),
    COALESCE((NEW.raw_user_meta_data->>'allow_reserve')::BOOLEAN, FALSE),
    COALESCE((NEW.raw_user_meta_data->>'allow_overtime')::BOOLEAN, FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
