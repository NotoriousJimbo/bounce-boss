const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { sendEmail } = require('../services/emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin middleware
const isAdmin = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('Role')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    if (!user || user.Role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Login handler
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('Email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.Email,
        role: user.Role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register handler (admin only)
const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id')
      .eq('Email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const { data: newUser, error } = await supabase
      .from('User')
      .insert([
        {
          Email: email,
          Password: hashedPassword,
          Role: role || 'user'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.Email,
        role: newUser.Role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const { data: user, error } = await supabase
      .from('User')
      .select('id, Email')
      .eq('Email', email)
      .single();

    if (error || !user) {
      // We don't want to expose whether the email exists or not for security reasons
      return res.json({ message: 'If the email exists, a password reset link will be sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // Token valid for 1 hour

    // Store reset token in database
    const { error: updateError } = await supabase
      .from('User')
      .update({
        ResetToken: tokenHash,
        ResetTokenExpires: tokenExpires.toISOString()
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password.html?token=${resetToken}`;

    // Send email
    await sendEmail({
      to: user.Email,
      subject: 'Bounce Boss - Password Reset',
      html: `
        <h1>Reset Your Password</h1>
        <p>You requested a password reset for your Bounce Boss admin account.</p>
        <p>Click the link below to set a new password. This link is valid for 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'If the email exists, a password reset link will be sent.' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, ResetTokenExpires')
      .eq('ResetToken', tokenHash)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const now = new Date();
    const tokenExpiry = new Date(user.ResetTokenExpires);

    if (now > tokenExpiry) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Find user with valid token
    const { data: user, error } = await supabase
      .from('User')
      .select('id, ResetTokenExpires')
      .eq('ResetToken', tokenHash)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const now = new Date();
    const tokenExpiry = new Date(user.ResetTokenExpires);

    if (now > tokenExpiry) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('User')
      .update({
        Password: hashedPassword,
        ResetToken: null,
        ResetTokenExpires: null
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  login,
  register,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
