require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createAdminUser() {
  const adminEmail = 'admin@bounceboss.com';
  const adminPassword = 'Admin@123'; // You should change this password

  try {
    // Check if admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id')
      .eq('Email', adminEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const { data: newUser, error } = await supabase
      .from('User')
      .insert([
        {
          Email: adminEmail,
          Password: hashedPassword,
          Role: 'admin'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log('Admin user created successfully:', {
      id: newUser.id,
      email: newUser.Email,
      role: newUser.Role
    });
  } catch (err) {
    console.error('Error creating admin user:', err.message);
    console.error('Error details:', err);
  }
}

createAdminUser(); 