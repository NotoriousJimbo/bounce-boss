# Google Calendar Integration Setup

This document guides you through the process of setting up Google Calendar API integration for the Bounce Boss booking system.

## Overview

The Bounce Boss application uses the Google Calendar API to:
- Create events for new bookings
- Check availability before confirming new bookings
- Update events when bookings are modified
- Delete events when bookings are cancelled
- Display upcoming events in the admin dashboard

## Prerequisites

- A Google account
- Google Cloud Platform project
- Service account with appropriate permissions

## Setup Steps

### 1. Create a Google Cloud Platform (GCP) Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" button at the top of the page
3. Enter "Bounce Boss Calendar" as the project name
4. Click "Create"
5. Make note of your Project ID

### 2. Enable the Google Calendar API

1. In your GCP project, go to the Navigation menu (hamburger icon) → APIs & Services → Library
2. Search for "Google Calendar API"
3. Click on the Google Calendar API result
4. Click "Enable" button

### 3. Create a Service Account

A service account allows your application to authenticate with Google's APIs without user intervention.

1. In your GCP project, go to the Navigation menu → IAM & Admin → Service Accounts
2. Click "Create Service Account" at the top of the page
3. Enter a service account name (e.g., "bounce-boss-calendar-service")
4. Optionally add a description like "Service account for Bounce Boss calendar integration"
5. Click "Create and Continue"
6. For the "Grant this service account access to project" step, add the following roles:
   - "Calendar API Admin" (or at minimum "Calendar API User")
7. Click "Continue" and then "Done"

### 4. Create and Download Service Account Key

1. From the list of service accounts, click on the one you just created
2. Click on the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" as the key type
5. Click "Create"
6. The key file will be automatically downloaded to your computer
7. Keep this file secure and do not commit it to version control

### 5. Share Your Google Calendar with the Service Account

1. Go to [Google Calendar](https://calendar.google.com/)
2. Under "My calendars" on the left, hover over the calendar you want to use and click the three dots
3. Select "Settings and sharing"
4. Scroll down to "Share with specific people or groups"
5. Click "Add people and groups"
6. Enter the email address of your service account (looks like: service-account-name@project-id.iam.gserviceaccount.com)
7. Set permissions to "Make changes to events" or higher
8. Click "Send"

### 6. Get Calendar ID

1. In Google Calendar settings for the calendar you're using
2. Scroll down to "Integrate calendar"
3. Find the "Calendar ID" field (will look like an email address)
4. Copy this value

### 7. Configure Environment Variables

Add the following variables to your `.env` file:

```
GOOGLE_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Long-Private-Key-Value\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

Notes:
- Be sure to include the quotes around the private key value
- The private key must include `\n` for line breaks exactly as shown in the downloaded JSON file

### 8. Install Required Packages

The Google Calendar integration requires the following npm packages:

```bash
npm install googleapis luxon
```

### 9. Testing the Integration

After setup, test the integration by running:

```bash
node server/scripts/test-calendar-integration.js
```

This script will:
1. Create a test event
2. Check availability
3. Update the test event
4. List upcoming events
5. Delete the test event

If all tests pass, your Google Calendar integration is working correctly.

## Troubleshooting

### "Error: No access, refresh token or API key is set"
- Check that your environment variables are set correctly
- Verify the GOOGLE_PRIVATE_KEY includes proper line breaks (\n)
- Ensure the service account has permissions to access the calendar

### "Error: Not Found"
- Verify that the GOOGLE_CALENDAR_ID is correct
- Make sure you've shared the calendar with the service account email

### "Error: Forbidden"
- Check that the service account has appropriate permissions
- Verify you've granted the service account access to your calendar

### "Error: Invalid Credentials"
- Double-check the GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY
- Ensure the service account key hasn't been revoked or expired
