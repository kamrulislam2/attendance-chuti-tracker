-- Supabase SQL Migration Script: Split Leave Settlements Support
-- Copy and run this script in your Supabase SQL Editor:

-- 1. Add columns to store split days
ALTER TABLE public.leave_settlements ADD COLUMN IF NOT EXISTS carry_forward_days NUMERIC(4, 1) DEFAULT 0;
ALTER TABLE public.leave_settlements ADD COLUMN IF NOT EXISTS payment_days NUMERIC(4, 1) DEFAULT 0;
ALTER TABLE public.leave_settlements ADD COLUMN IF NOT EXISTS adjust_leave_days NUMERIC(4, 1) DEFAULT 0;

-- 2. Drop the existing action_type check constraint
ALTER TABLE public.leave_settlements DROP CONSTRAINT IF EXISTS leave_settlements_action_type_check;

-- 3. Add updated check constraint to allow 'split' as a valid action type
ALTER TABLE public.leave_settlements ADD CONSTRAINT leave_settlements_action_type_check 
  CHECK (action_type IN ('carry_forward', 'payment', 'adjust_leave', 'split'));
