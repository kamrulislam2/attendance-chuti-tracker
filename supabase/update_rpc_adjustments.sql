-- SQL migration to update public.admin_insert_chuti_records_bulk to support individual adjustments per date.
-- Run this in your Supabase dashboard SQL Editor.

DROP FUNCTION IF EXISTS public.admin_insert_chuti_records_bulk(UUID, DATE[], TEXT, BOOLEAN, BOOLEAN, TIME, TIME, INTERVAL, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.admin_insert_chuti_records_bulk(
  p_user_id UUID,
  p_dates DATE[],
  p_leave_type TEXT,
  p_adjustments BOOLEAN[],
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
  v_idx INT := 1;
  v_adjustment BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can insert chuti records for other users';
  END IF;

  FOREACH v_date IN ARRAY p_dates LOOP
    v_adjustment := p_adjustments[v_idx];
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
      v_adjustment,
      CASE WHEN (p_leave_type = 'Overtime' OR p_leave_type = 'Reserve') AND v_adjustment THEN p_adjust_short_leave ELSE false END,
      p_sign_in_time,
      p_sign_out_time,
      p_leave_hour,
      p_reserve_holiday,
      CASE WHEN p_leave_type = 'Reserve' AND v_adjustment THEN 'approved'::TEXT ELSE 'none'::TEXT END,
      'approved', -- Admin added records are auto-approved
      p_comment,
      p_bulk_id
    );
    v_idx := v_idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
