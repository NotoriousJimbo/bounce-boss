const fs = require('fs').promises;
const path = require('path');
const { createTransporter } = require('../config/email');

/**
 * Simple template engine to replace placeholders in HTML templates
 * @param {string} template - The HTML template with placeholders
 * @param {Object} data - The data to insert into the template
 * @returns {string} - The processed HTML
 */
const processTemplate = (template, data) => {
  let processedTemplate = template;
  
  // Handle if conditions (basic implementation)
  const ifRegex = /{{#if\s+([^}]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
  processedTemplate = processedTemplate.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
    return data[condition] ? ifContent : elseContent;
  });
  
  // Handle each loops (basic implementation)
  const eachRegex = /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g;
  processedTemplate = processedTemplate.replace(eachRegex, (match, arrayName, content) => {
    if (!data[arrayName] || !Array.isArray(data[arrayName])) return '';
    
    return data[arrayName].map(item => {
      let itemContent = content;
      // Replace item properties
      Object.keys(item).forEach(key => {
        const itemRegex = new RegExp(`{{${key}}}`, 'g');
        itemContent = itemContent.replace(itemRegex, item[key]);
      });
      return itemContent;
    }).join('');
  });
  
  // Replace simple placeholders
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, data[key] || '');
  });
  
  return processedTemplate;
};

/**
 * Load an email template from file
 * @param {string} templateName - The name of the template file without extension
 * @returns {Promise<string>} - The template content
 */
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    const template = await fs.readFile(templatePath, 'utf8');
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

/**
 * Send an email
 * @param {Object} options - Email sending options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.from - Sender email address (optional)
 * @param {Array} options.cc - CC recipients (optional)
 * @param {Array} options.bcc - BCC recipients (optional)
 * @returns {Promise<Object>} - Sending result
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      throw new Error('Email transporter not available');
    }
    
    const emailDefaults = {
      from: process.env.EMAIL_FROM || `"Bounce Boss" <${process.env.EMAIL_USER}>`,
    };
    
    const mailOptions = { ...emailDefaults, ...options };
    const result = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully to ${options.to}`);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send a booking confirmation email
 * @param {Object} booking - The booking data
 * @param {string} recipientEmail - The recipient's email address
 * @returns {Promise<Object>} - Sending result
 */
const sendBookingConfirmationEmail = async (booking, recipientEmail) => {
  const template = await loadTemplate('booking-confirmation');
  
  // Prepare data for the template
  const bookingAddress = `${booking.address}, ${booking.city}, ${booking.state} ${booking.zipCode}`;
  const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const templateData = {
    customerName: `${booking.firstName} ${booking.lastName}`,
    bookingId: booking.id,
    eventDate,
    setupTime: booking.setupTime,
    pickupTime: booking.pickupTime,
    location: bookingAddress,
    products: Array.isArray(booking.products) 
      ? booking.products.map(p => p.name).join(', ') 
      : booking.productName,
    bookingUrl: `${process.env.WEBSITE_URL || 'https://bounceboss.com'}/confirmation.html?id=${booking.id}`
  };
  
  const html = processTemplate(template, templateData);
  
  return sendEmail({
    to: recipientEmail,
    subject: 'Your Bounce Boss Booking is Confirmed!',
    html
  });
};

/**
 * Send a payment receipt email
 * @param {Object} booking - The booking data
 * @param {Object} payment - The payment data
 * @param {string} recipientEmail - The recipient's email address
 * @returns {Promise<Object>} - Sending result
 */
const sendPaymentReceiptEmail = async (booking, payment, recipientEmail) => {
  const template = await loadTemplate('payment-receipt');
  
  // Format payment date
  const transactionDate = new Date(payment.created || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Format event date
  const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Prepare items for receipt
  const items = Array.isArray(booking.products) 
    ? booking.products.map(product => ({
        name: product.name,
        description: product.description || 'Bounce House Rental',
        price: (product.price / 100).toFixed(2)
      }))
    : [{
        name: booking.productName,
        description: 'Bounce House Rental',
        price: ((booking.amount || payment.amount) / 100).toFixed(2)
      }];
  
  // Calculate totals
  const subtotal = items.reduce((total, item) => total + parseFloat(item.price), 0);
  const taxRate = 5; // 5% tax rate (should be in config)
  const taxAmount = (subtotal * (taxRate / 100)).toFixed(2);
  const totalAmount = (subtotal + parseFloat(taxAmount)).toFixed(2);
  
  const templateData = {
    customerName: `${booking.firstName} ${booking.lastName}`,
    customerEmail: recipientEmail,
    transactionDate,
    transactionId: payment.id,
    paymentMethod: `${payment.payment_method_details?.card?.brand || 'Card'} ending in ${payment.payment_method_details?.card?.last4 || '****'}`,
    items,
    subtotal: subtotal.toFixed(2),
    taxRate,
    taxAmount,
    totalAmount,
    discountCode: payment.discount?.code,
    discountAmount: payment.discount?.amount ? (payment.discount.amount / 100).toFixed(2) : null,
    eventDate,
    setupTime: booking.setupTime,
    pickupTime: booking.pickupTime,
    location: `${booking.address}, ${booking.city}, ${booking.state} ${booking.zipCode}`,
    bookingUrl: `${process.env.WEBSITE_URL || 'https://bounceboss.com'}/confirmation.html?id=${booking.id}`
  };
  
  const html = processTemplate(template, templateData);
  
  return sendEmail({
    to: recipientEmail,
    subject: 'Payment Receipt - Bounce Boss',
    html
  });
};

/**
 * Send an admin notification email
 * @param {Object} booking - The booking data
 * @param {Object} payment - The payment data (optional)
 * @returns {Promise<Object>} - Sending result
 */
const sendAdminNotificationEmail = async (booking, payment = null) => {
  if (!process.env.ADMIN_EMAIL) {
    console.warn('Admin email not set. Skipping admin notification.');
    return null;
  }
  
  const template = await loadTemplate('admin-notification');
  
  const bookingAddress = `${booking.address}, ${booking.city}, ${booking.state} ${booking.zipCode}`;
  const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const createdAt = new Date(booking.createdAt || Date.now()).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const templateData = {
    bookingId: booking.id,
    customerName: `${booking.firstName} ${booking.lastName}`,
    customerEmail: booking.email,
    customerPhone: booking.phone,
    eventDate,
    setupTime: booking.setupTime,
    pickupTime: booking.pickupTime,
    location: bookingAddress,
    products: Array.isArray(booking.products) 
      ? booking.products.map(p => p.name).join(', ') 
      : booking.productName,
    specialRequests: booking.specialRequests || 'None',
    createdAt,
    paymentStatus: payment ? 'Paid' : 'Pending',
    totalAmount: payment 
      ? ((payment.amount || booking.amount) / 100).toFixed(2)
      : (booking.amount / 100).toFixed(2),
    bookingConflicts: booking.hasConflicts || false,
    adminBookingUrl: `${process.env.WEBSITE_URL || 'https://bounceboss.com'}/admin/dashboard.html?booking=${booking.id}`
  };
  
  const html = processTemplate(template, templateData);
  
  return sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: 'New Booking Alert - Bounce Boss',
    html
  });
};

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendAdminNotificationEmail,
  sendEmail // Export general purpose email function
};
