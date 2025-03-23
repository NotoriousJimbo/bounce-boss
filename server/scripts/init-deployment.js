// This script runs necessary initialization steps for deployment
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Running deployment initialization tasks...');

// Ensure CSS is built (although this should be done by postinstall)
try {
  console.log('Building CSS...');
  execSync('npx tailwindcss -i ./public/css/styles.css -o ./public/css/output.css', { stdio: 'inherit' });
  console.log('CSS build completed.');
} catch (error) {
  console.error('Error building CSS:', error.message);
  // Don't exit, try to continue with other init tasks
}

// Create admin user
try {
  console.log('Creating admin user if needed...');
  require('./create-admin');
  // Note: create-admin.js handles its own console output
} catch (error) {
  console.error('Error creating admin user:', error.message);
}

console.log('Deployment initialization complete.');
