-- Migration: Add updated_at column to chuti table for delta sync support
-- Run this in Supabase SQL Editor

-- Step 1: Add updated_at column with default NOW()
ALTER TABLE public.chuti
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Backfill existing rows — set updated_at = created_at for old records
UPDATE public.chuti SET updated_at = created_at WHERE updated_at IS NULL;

-- Step 3: Create trigger to auto-update updated_at on every row modification
CREATE OR REPLACE FUNCTION public.update_chuti_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chuti_set_updated_at ON public.chuti;
CREATE TRIGGER chuti_set_updated_at
  BEFORE UPDATE ON public.chuti
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chuti_updated_at();

-- Step 4: Create index on updated_at for fast delta queries
CREATE INDEX IF NOT EXISTS idx_chuti_updated_at ON public.chuti(updated_at);

-- Step 5 (Optional): Add updated_at to other tables if needed later
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE public.govt_holiday_responses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE public.leave_settlements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
