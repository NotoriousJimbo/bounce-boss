const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail SMTP transport configuration
const createTransporter = async () => {
  // For security reasons, we're using environment variables
  // These need to be added to the .env file:
  // EMAIL_USER=your-gmail@gmail.com
  // EMAIL_PASS=your-app-password (not your Gmail password)
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Email environment variables not set. Email functionality will not work.');
    return null;
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Verify the connection configuration
  try {
    await transporter.verify();
    console.log('SMTP connection to Gmail established successfully');
    return transporter;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return null;
  }
};

module.exports = { createTransporter };
