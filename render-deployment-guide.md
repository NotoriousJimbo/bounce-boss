# Deploying Bounce Boss to Render.com

This guide walks you through deploying your Bounce Boss application to Render's Web Service platform.

## Step 1: Prepare Your GitHub Repository

1. Create a GitHub account if you don't already have one at github.com
2. Create a new repository named "bounce-boss" (or your preferred name)
3. Initialize Git in your local project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. Connect your local repository to GitHub:
   ```
   git remote add origin https://github.com/yourusername/bounce-boss.git
   git push -u origin main
   ```

## Step 2: Prepare Your Project for Production

1. Create a `.gitignore` file to exclude sensitive files:
   ```
   node_modules/
   .env
   server/logs/
   ```

2. Verify your `package.json` has the correct start script:
   ```json
   "scripts": {
     "start": "node server/server.js",
     ...
   }
   ```

## Step 3: Deploy to Render

1. Sign in to your Render account at dashboard.render.com
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: bounce-boss (or your preferred name)
   - **Environment**: Node
   - **Region**: Choose the closest to your target audience
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Set environment variables (click "Advanced" > "Add Environment Variable"):
   ```
   PORT=10000  # Render will override this, but include it anyway
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

6. Update URL-related environment variables:
   ```
   WEBSITE_URL=https://your-app-name.onrender.com
   FRONTEND_URL=https://your-app-name.onrender.com
   ```

7. Select a plan:
   - **Free**: Perfect for demos (750 hours/month, auto-sleep after inactivity)
   - **Starter**: $7/month for continuous operation without sleep

8. Click "Create Web Service"

## Step 4: Post-Deployment Tasks

1. Once deployed, check your Render dashboard for your service URL
2. Visit your application to verify it works correctly
3. Test key functionality:
   - Navigation between pages
   - Booking form submission
   - Admin area access

## Important Production Considerations

1. **Database Setup**: Ensure Supabase tables are properly initialized for production
2. **Test Environment Variables**: Verify all API keys and credentials work in production
3. **Custom Domain**: You can add a custom domain in the Render dashboard settings
4. **Logs**: Monitor application logs through the Render dashboard
5. **Sleep Mode**: The free tier will sleep after inactivity, causing a delay on first access

## Troubleshooting

- **Deployment Failures**: Check build logs in the Render dashboard
- **Runtime Errors**: Review the logs section in your Render dashboard
- **Database Connection Issues**: Verify Supabase credentials and network access
- **Missing Environment Variables**: Ensure all required variables are correctly set
