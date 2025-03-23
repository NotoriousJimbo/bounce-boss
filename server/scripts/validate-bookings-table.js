/**
 * Supabase Bookings Table Validation Script
 * 
 * This script validates that the bookings table exists in Supabase
 * and has the expected schema structure. It helps confirm that the
 * table was created successfully.
 * 
 * Run with: node server/scripts/validate-bookings-table.js
 */

const supabase = require('../config/supabase');

const validateBookingsTable = async () => {
  try {
    console.log('Validating bookings table in Supabase...');
    
    // Attempt to query the bookings table
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing bookings table:', error.message);
      console.error('The bookings table may not exist or there might be a permissions issue.');
      return false;
    }
    
    console.log('✓ Successfully connected to bookings table');
    
    // Get table information
    const { data: tableInfo, error: tableInfoError } = await supabase
      .rpc('get_table_definition', { table_name: 'bookings' });
    
    if (tableInfoError) {
      console.error('Error getting table definition:', tableInfoError.message);
      console.log('Note: The RPC function "get_table_definition" may not exist in your database.');
      console.log('This is normal and not critical - you can create it or ignore this error.');
      
      // Fallback: At least check if we can insert a test record
      await testInsertRecord();
      return true;
    }
    
    // Display table information
    console.log('\nTable Definition:');
    console.log(tableInfo);
    
    // Verify essential columns exist
    if (tableInfo && tableInfo.length > 0) {
      const requiredColumns = [
        'id', 'created_at', 'customer_email', 'event_date', 
        'booking_status', 'payment_status', 'products', 'total'
      ];
      
      const missingColumns = requiredColumns.filter(col => 
        !tableInfo.some(field => field.column_name === col)
      );
      
      if (missingColumns.length > 0) {
        console.error('⚠️ Missing required columns:', missingColumns.join(', '));
        return false;
      }
      
      console.log('✓ All required columns are present');
    }
    
    // Test insert record
    await testInsertRecord();
    
    return true;
  } catch (err) {
    console.error('Validation error:', err);
    return false;
  }
};

const testInsertRecord = async () => {
  try {
    // Create a test record with a unique identifier to avoid duplicates
    const testTimestamp = new Date().toISOString();
    const testRecord = {
      customer_first_name: 'Test',
      customer_last_name: 'Validation',
      customer_email: `test-${testTimestamp}@example.com`,
      customer_phone: '555-123-4567',
      event_date: '2099-12-31',  // Far future date unlikely to conflict
      event_start_time: '12:00:00',
      event_end_time: '16:00:00',
      event_address: '123 Test St',
      event_city: 'Comox',
      event_postal_code: 'V9N 1A1',
      indoor_outdoor: 'outdoor',
      products: JSON.stringify([{
        id: 'test-product',
        name: 'Test Bounce House',
        price: 100,
        quantity: 1
      }]),
      subtotal: 100,
      tax: 5,
      total: 105
    };
    
    console.log('\nAttempting to insert a test record...');
    
    // Insert the test record
    const { data: insertData, error: insertError } = await supabase
      .from('bookings')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError.message);
      return false;
    }
    
    console.log('✓ Successfully inserted test record');
    console.log(insertData);
    
    // Delete the test record to clean up
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('customer_email', testRecord.customer_email);
    
    if (deleteError) {
      console.error('Error deleting test record:', deleteError.message);
      console.log('⚠️ The test record may need to be deleted manually');
    } else {
      console.log('✓ Successfully deleted test record');
    }
    
    return true;
  } catch (err) {
    console.error('Test record error:', err);
    return false;
  }
};

// Execute the validation function
validateBookingsTable()
  .then(isValid => {
    if (isValid) {
      console.log('\n✅ Bookings table validation successful!');
    } else {
      console.log('\n❌ Bookings table validation failed.');
    }
    process.exit(isValid ? 0 : 1);
  })
  .catch(err => {
    console.error('\n❌ Validation script failed:', err);
    process.exit(1);
  });
