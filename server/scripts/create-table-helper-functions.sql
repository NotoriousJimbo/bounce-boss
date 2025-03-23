-- Table Helper Functions for Bounce Boss
-- This SQL script creates utility functions for the database
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Function to get table definition details
-- This is used by the validation script to verify the table structure
CREATE OR REPLACE FUNCTION get_table_definition(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' 
    AND c.table_name = table_name
  ORDER BY 
    c.ordinal_position;
END;
$$;

-- Function to check for booking date conflicts
-- This will be used to verify date availability when creating new bookings
CREATE OR REPLACE FUNCTION check_booking_availability(
  check_date date,
  check_start_time time,
  check_end_time time
) 
RETURNS TABLE (
  is_available boolean,
  conflict_count integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    (COUNT(*) = 0) as is_available,
    COUNT(*) as conflict_count
  FROM
    bookings
  WHERE
    event_date = check_date
    AND booking_status NOT IN ('cancelled')
    AND (
      (check_start_time BETWEEN event_start_time AND event_end_time)
      OR (check_end_time BETWEEN event_start_time AND event_end_time)
      OR (event_start_time BETWEEN check_start_time AND check_end_time)
    );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_table_definition TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_availability TO authenticated, anon;

-- Example usage (commented out):
-- SELECT * FROM get_table_definition('bookings');
-- SELECT * FROM check_booking_availability('2025-04-15', '12:00:00', '16:00:00');
