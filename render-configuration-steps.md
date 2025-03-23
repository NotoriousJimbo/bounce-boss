# Render Configuration Steps

Based on your screenshot, here's how to complete the Render deployment:

## 1. Basic Configuration
- **Name**: Enter "bounce-boss" in the name field
- **Language**: Node (already selected)
- **Branch**: main (already selected) 
- **Region**: Oregon (US West) is fine (already selected)

## 2. Build and Start Commands
(Scroll down to find these settings)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 3. Environment Variables
(Click "Advanced" button and then "Add Environment Variable" for each)

```
PORT=10000
SUPABASE_URL=https://euaudkywgqnsvaohrzxo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1YXVka3l3Z3Fuc3Zhb2hyenhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzUwOTIsImV4cCI6MjA1ODI1MTA5Mn0.J7cy1tI4OzW9fhYef3Y1V4bNjHWbA4ZQ983qUsAgcrk
JWT_SECRET=bounce_boss_jwt_secret_key_2024_secure_9x8q7w
STRIPE_PUBLISHABLE_KEY=pk_test_51R5fgOIrObeZHL3VYEZikxWFkE2O4lVun04cVBQYteFzWhTAFuaMVkUerfodhqEP5dNThIE6AkS47S6dYQCawnpa002jcjUkXo
STRIPE_SECRET_KEY=sk_test_51R5fgOIrObeZHL3V0lAN6urGhqSoo9gXNAUQ5w6U6YSqZLXlgXc0zQBiCONcnRMR3vPkcCK8J2x8Hy9LbjKL6gmo00dDVAvLoX
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Bounce Boss <your-gmail@gmail.com>"
ADMIN_EMAIL=admin@bounceboss.com
NODE_ENV=production
```

## 4. URL Configuration
(These URLs need to be set to your Render app URL)
```
WEBSITE_URL=https://bounce-boss.onrender.com
FRONTEND_URL=https://bounce-boss.onrender.com
```

## 5. Plan Selection
- **Free**: Recommended for demo purposes (Select this plan)
  - 750 hours/month 
  - Auto-sleep after inactivity

## 6. Create Web Service
- Click the "Create Web Service" button at the bottom of the page

## After Deployment
- Wait for the build and deployment to complete (monitor the logs)
- Once deployed, your site will be available at: https://bounce-boss.onrender.com
