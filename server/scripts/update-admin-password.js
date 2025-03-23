require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function updateAdminPassword() {
  const adminEmail = 'admin@bounceboss.com';
  const adminPassword = 'Admin@123';

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Update the admin user's password
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', adminEmail)
      .select()
      .single();

    if (error) throw error;

    console.log('Admin password updated successfully for:', data.email);
  } catch (err) {
    console.error('Error updating admin password:', err.message);
  }
}

updateAdminPassword(); 