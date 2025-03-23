/**
 * Google Calendar API Configuration
 * 
 * This module provides configuration and setup for Google Calendar API integration.
 * It uses the googleapis library to create a calendar client that can be used
 * for managing booking events in Google Calendar.
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');
require('dotenv').config();

// Environment variables for Google Calendar API
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// Flag to indicate if Google Calendar integration is available
const isGoogleCalendarConfigured = !!(GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_CALENDAR_ID);

// Log status of Google Calendar configuration
if (!isGoogleCalendarConfigured) {
  const missingVars = [];
  if (!GOOGLE_CLIENT_EMAIL) missingVars.push('GOOGLE_CLIENT_EMAIL');
  if (!GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!GOOGLE_CALENDAR_ID) missingVars.push('GOOGLE_CALENDAR_ID');
  
  logger.warn(`Google Calendar integration is disabled. Missing environment variables: ${missingVars.join(', ')}`);
  logger.info('The application will run without Google Calendar features.');
} else {
  logger.info('Google Calendar integration is configured and enabled.');
}

/**
 * Create JWT client for Google Calendar API
 * Using service account authentication (recommended for server-to-server apps)
 */
const createCalendarClient = () => {
  if (!isGoogleCalendarConfigured) {
    logger.warn('Attempted to create Google Calendar client but configuration is missing');
    return { 
      disabled: true,
      calendar: {
        events: {
          // Stub methods that return resolved promises with dummy data
          list: async () => ({ data: { items: [] } }),
          insert: async () => ({ data: { id: 'mock-event-id' } }),
          update: async () => ({ data: { updated: true } }),
          delete: async () => ({ data: { deleted: true } })
        }
      }
    };
  }
  
  try {
    // Create JWT auth client
    const jwtClient = new google.auth.JWT(
      GOOGLE_CLIENT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/calendar'],
    );

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });
    
    return { jwtClient, calendar, disabled: false };
  } catch (error) {
    logger.error('Error creating Google Calendar client:', { error });
    
    // Return disabled client with stub methods
    return { 
      disabled: true,
      error,
      calendar: {
        events: {
          list: async () => ({ data: { items: [] } }),
          insert: async () => ({ data: { id: 'mock-event-id' } }),
          update: async () => ({ data: { updated: true } }),
          delete: async () => ({ data: { deleted: true } })
        }
      }
    };
  }
};

module.exports = {
  createCalendarClient,
  GOOGLE_CALENDAR_ID,
  isGoogleCalendarConfigured
};
