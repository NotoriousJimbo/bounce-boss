/**
 * Supabase Bookings Table Setup Script
 * 
 * This script creates the bookings table in Supabase with all necessary fields
 * for the Bounce Boss rental business. It's designed to be run once to initialize
 * the database schema.
 * 
 * Run with: node server/scripts/create-bookings-table.js
 */

const supabase = require('../config/supabase');

const createBookingsTable = async () => {
  try {
    console.log('Creating bookings table in Supabase...');
    
    // Note: This script uses Supabase's REST API rather than direct SQL commands
    // since we're using the JavaScript client library
    
    // Check if the table already exists
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (!tableCheckError) {
      console.log('Bookings table already exists.');
      return;
    }
    
    // Create the table using raw SQL via the REST API
    // Since Supabase JS client doesn't directly support CREATE TABLE,
    // we'd typically use the Supabase dashboard UI or PostgreSQL client for this
    
    console.log(`
      The bookings table needs to be created in the Supabase dashboard with the following schema:
      
      Table Name: bookings
      
      Columns:
      - id: uuid (primary key, default: uuid_generate_v4())
      - created_at: timestamp with time zone (default: now())
      - updated_at: timestamp with time zone (default: now())
      - customer_first_name: text (not null)
      - customer_last_name: text (not null)
      - customer_email: text (not null)
      - customer_phone: text (not null)
      - customer_address: text
      - event_date: date (not null)
      - event_start_time: time (not null)
      - event_end_time: time (not null)
      - event_address: text (not null)
      - event_city: text (not null)
      - event_postal_code: text (not null)
      - event_type: text
      - event_notes: text
      - indoor_outdoor: text (not null) [Options: 'indoor', 'outdoor', 'both']
      - booking_status: text (not null, default: 'pending') [Options: 'pending', 'confirmed', 'cancelled', 'completed']
      - payment_status: text (not null, default: 'unpaid') [Options: 'unpaid', 'partial', 'paid', 'refunded']
      - payment_amount: numeric (default: 0)
      - payment_id: text
      - payment_date: timestamp with time zone
      - products: jsonb (not null) [Array of selected products with quantities and prices]
      - subtotal: numeric (not null)
      - tax: numeric (not null)
      - total: numeric (not null)
      - discount_code: text
      - discount_amount: numeric (default: 0)
      - terms_accepted: boolean (not null, default: false)
      - terms_accepted_at: timestamp with time zone
      - ip_address: text
      - referral_source: text
      - admin_notes: text
    `);
    
    // Test query to verify connection
    const { data, error } = await supabase
      .from('dummy_test')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful');
      console.log('Please create the bookings table in the Supabase dashboard using the schema above');
    }
  } catch (err) {
    console.error('Error setting up bookings table:', err);
  }
};

// Execute the function
createBookingsTable()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));
