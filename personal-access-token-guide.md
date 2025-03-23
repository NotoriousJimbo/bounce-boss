# Creating a GitHub Personal Access Token

Follow these steps to create a token you can use for pushing to GitHub:

## Step 1: Access Developer Settings
1. Click on your profile icon in the top-right corner of GitHub
2. Click on "Settings" from the dropdown menu
3. Scroll down to the bottom of the left sidebar and click on "Developer settings"

## Step 2: Generate Personal Access Token
1. In the left sidebar, click on "Personal access tokens"
2. Click on "Tokens (classic)"
3. Click the "Generate new token" button
4. Select "Generate new token (classic)"

## Step 3: Configure Token
1. Name: Enter "Bounce Boss Deployment"
2. Expiration: Choose an appropriate expiration (30 days is good for temporary use)
3. Scopes: Select the "repo" checkbox to grant full access to repositories
4. Click "Generate token" at the bottom of the page

## Step 4: Copy Your Token
- After generating, GitHub will display your token ONCE
- Copy it immediately (you won't be able to see it again)
- Store it somewhere secure temporarily

## Step 5: Use Token for Git Push
Open a command prompt in your project directory and run:
```
git push -u origin main
```

When prompted:
- Username: NotoriousJimbo
- Password: Paste your personal access token (it won't be visible when you paste it)
