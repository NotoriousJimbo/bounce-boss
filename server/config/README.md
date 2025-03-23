# Supabase Configuration for Bounce Boss

This directory contains configuration files for connecting to Supabase, the database service used by Bounce Boss.

## Setup Process

### 1. Initial Setup

The main configuration file `supabase.js` initializes the connection to Supabase using environment variables. These should already be set in your `.env` file.

### 2. Creating the Bookings Table

To set up the bookings table in Supabase, you need to run the SQL script in the Supabase dashboard:

1. Log in to your [Supabase dashboard](https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of `server/scripts/create-bookings-table.sql` 
5. Paste it into the SQL Editor and run it

This will create:
- The `bookings` table with all required fields
- Indexes for common queries
- Row-level security policies
- A trigger to automatically update the `updated_at` timestamp

### 3. Setting Up Helper Functions

To enable additional functionality like checking booking availability:

1. In the Supabase SQL Editor
2. Copy the contents of `server/scripts/create-table-helper-functions.sql`
3. Paste it into the SQL Editor and run it

This will create:
- `get_table_definition` function (used for schema validation)
- `check_booking_availability` function (used for date availability checking)

### 4. Validating the Setup

To verify everything is set up correctly:

```bash
node server/scripts/validate-bookings-table.js
```

This script will:
- Check if the bookings table exists
- Verify the table structure 
- Attempt to insert and delete a test record
- Report any issues it encounters

## Schema Overview

The bookings table includes fields for:

- Customer information (name, email, phone, etc.)
- Event details (date, time, location, etc.)
- Booking status (pending, confirmed, cancelled, completed)
- Payment information (status, amount, ID, etc.)
- Product & pricing information
- Terms & Legal acceptance
- Additional information for admin use

## Usage in Code

To use Supabase in your code:

```javascript
const supabase = require('../config/supabase');

// Example query
const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*');
  
  if (error) throw error;
  return data;
};
```

## Troubleshooting

If you encounter connection issues:
1. Verify your Supabase URL and anon key in the `.env` file
2. Check if the Supabase service is running
3. Ensure your IP is not blocked by Supabase

For schema issues, run the validation script to identify problems.
