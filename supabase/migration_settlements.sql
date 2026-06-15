-- Supabase SQL Migration Script: Unified Leave Settlements
-- Copy and run this script in your Supabase SQL Editor:

-- 1. Drop existing check constraints and unique constraint
ALTER TABLE public.leave_settlements DROP CONSTRAINT IF EXISTS unique_user_year_category;
ALTER TABLE public.leave_settlements DROP CONSTRAINT IF EXISTS leave_settlements_action_type_check;
ALTER TABLE public.leave_settlements DROP CONSTRAINT IF EXISTS leave_settlements_status_check;

-- 2. Add 'period' column to support H1, H2, and Instant settlements
ALTER TABLE public.leave_settlements ADD COLUMN IF NOT EXISTS period VARCHAR(10) NOT NULL DEFAULT 'H2';

-- 3. Add new check constraints for action_type, status, and period
ALTER TABLE public.leave_settlements ADD CONSTRAINT leave_settlements_action_type_check 
  CHECK (action_type IN ('carry_forward', 'payment', 'adjust_leave'));

ALTER TABLE public.leave_settlements ADD CONSTRAINT leave_settlements_status_check 
  CHECK (status IN ('initiated', 'responded', 'processed'));

ALTER TABLE public.leave_settlements ADD CONSTRAINT leave_settlements_period_check 
  CHECK (period IN ('H1', 'H2', 'Instant'));

-- 4. Re-apply the UNIQUE constraint including the period column
ALTER TABLE public.leave_settlements ADD CONSTRAINT unique_user_year_period_category 
  UNIQUE (user_id, year, period, leave_category);

-- 5. Add RLS policy for user updates (allowing them to update their preferences if not finalized)
DROP POLICY IF EXISTS "Users can update own settlements" ON public.leave_settlements;
CREATE POLICY "Users can update own settlements"
  ON public.leave_settlements
  FOR UPDATE
  USING (auth.uid() = user_id AND status <> 'processed')
  WITH CHECK (auth.uid() = user_id AND status <> 'processed');
