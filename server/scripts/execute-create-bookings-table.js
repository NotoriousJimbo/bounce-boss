/**
 * Execute Bookings Table SQL Creation Script
 * 
 * This script executes the SQL in create-bookings-table.sql directly through
 * the Supabase client to ensure the table is properly created with all columns.
 * 
 * Run with: node server/scripts/execute-create-bookings-table.js
 */

const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function executeCreateBookingsTable() {
  try {
    console.log('Reading SQL script...');
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'create-bookings-table.sql'),
      'utf8'
    );

    console.log('Executing SQL script to create bookings table...');
    // Execute each SQL statement separately (separating by semicolons)
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    // Execute statements one by one
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing statement: ${statement.slice(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Skip the error if it's about the function already existing
          if (error.message.includes('already exists')) {
            console.log('Function already exists, continuing...');
            continue;
          }
          console.error('Error executing SQL statement:', error);
          throw error;
        }
      }
    }

    console.log('SQL script executed successfully!');
    console.log('Verifying bookings table exists...');

    // Simple test query to verify table exists
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error verifying bookings table:', error);
      throw error;
    }

    console.log('✅ Bookings table verified!');
    console.log('Columns available:', Object.keys(data[0] || {}).join(', '));
    
  } catch (error) {
    // Check if it's a "function does not exist" error for exec_sql
    if (error.message && error.message.includes('function exec_sql() does not exist')) {
      console.error('\n❌ Error: The exec_sql function does not exist in your Supabase database.');
      console.log('\nYou need to create this function first. Run the following SQL in the Supabase SQL Editor:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      process.exit(1);
    }

    console.error('Error creating bookings table:', error);
    process.exit(1);
  }
}

// Execute the function
executeCreateBookingsTable()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
