-- Bookings Table Schema for Bounce Boss
-- This SQL script creates the bookings table in Supabase
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if it exists (comment out for production use)
-- DROP TABLE IF EXISTS bookings;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Customer Information
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  
  -- Event Details
  event_date DATE NOT NULL,
  event_start_time TIME NOT NULL,
  event_end_time TIME NOT NULL,
  event_address TEXT NOT NULL,
  event_city TEXT NOT NULL,
  event_postal_code TEXT NOT NULL,
  event_type TEXT,
  event_notes TEXT,
  indoor_outdoor TEXT NOT NULL CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  
  -- Booking Status
  booking_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- Payment Information
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  payment_amount NUMERIC DEFAULT 0,
  payment_id TEXT,
  payment_date TIMESTAMPTZ,
  
  -- Product & Pricing Information
  products JSONB NOT NULL, -- Array of selected products with quantities and prices
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  discount_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  
  -- Terms & Legal
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  ip_address TEXT,
  
  -- Additional Information
  referral_source TEXT,
  admin_notes TEXT
);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function on each update
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);

-- Add row level security (RLS) policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin access)
CREATE POLICY "Admin users can do everything" ON bookings
  FOR ALL
  TO authenticated
  USING (true);

-- Create policy for anonymous reads (for available dates checking)
CREATE POLICY "Anon can read event dates for availability checks" ON bookings
  FOR SELECT
  TO anon
  USING (true)
  WITH CHECK (false);

-- Sample query to validate schema (commented out)
-- SELECT * FROM bookings LIMIT 10;

-- Example row insert for testing (commented out)
/*
INSERT INTO bookings (
  customer_first_name, 
  customer_last_name, 
  customer_email, 
  customer_phone, 
  event_date, 
  event_start_time, 
  event_end_time, 
  event_address, 
  event_city, 
  event_postal_code, 
  indoor_outdoor, 
  products, 
  subtotal, 
  tax, 
  total
) VALUES (
  'Test', 
  'User', 
  'test@example.com', 
  '555-123-4567', 
  '2025-04-15', 
  '12:00:00', 
  '16:00:00', 
  '123 Main St', 
  'Comox', 
  'V9N 1A1', 
  'outdoor', 
  '[{"id": "bounce-house-1", "name": "Castle Bounce House", "price": 150, "quantity": 1}]', 
  150.00, 
  7.50, 
  157.50
);
*/
