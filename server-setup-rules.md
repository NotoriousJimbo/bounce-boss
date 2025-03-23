# Server Setup Rules and Troubleshooting Guide

## Server Configuration
1. Server.js Location
   - Place server.js in the `server` directory
   - Main entry point: `server/server.js`
   - Use relative paths from server.js location

2. Package.json Configuration
   ```json
   {
     "main": "server/server.js",
     "scripts": {
       "start": "node server/server.js",
       "dev": "nodemon server/server.js",
       "build:css": "tailwindcss -i ./public/css/styles.css -o ./public/css/output.css --watch"
     }
   }
   ```

3. Directory Structure
   ```
   project_root/
   ├── server/
   │   ├── server.js
   │   ├── scripts/
   │   ├── middleware/
   │   └── routes/
   ├── public/
   │   ├── index.html
   │   ├── bounce-houses.html
   │   ├── sky-dancers.html
   │   ├── about.html
   │   ├── contact.html
   │   └── images/
   ├── package.json
   └── tailwind.config.js
   ```

## Server Startup Process
1. Development Mode
   ```powershell
   npm run dev
   ```
   - Uses nodemon for auto-reload
   - Watches for file changes
   - Available commands:
     - `rs` to restart manually
     - Ctrl+C to stop server

2. Production Mode
   ```powershell
   npm start
   ```
   - Uses node directly
   - No auto-reload
   - Ctrl+C to stop server

## Available Routes
1. Public Routes
   - GET / (Home page)
   - GET /faqs (FAQs page)
   - GET /bounce-houses (Bounce Houses page)
   - GET /sky-dancers (Sky Dancers page)
   - GET /about (About page)
   - GET /contact (Contact page)

2. Admin Routes
   - GET /login (Admin login)
   - GET /admin (Admin dashboard)

3. API Routes
   - /api/auth/*
   - /api/admin/*
   - /api/bookings/*
   - /api/products/*

## PowerShell Syntax Rules
1. Don't use `&&` for command chaining in PowerShell
   - Wrong: `cd bounce-boss && node server.js`
   - Correct: Use separate commands or `;` operator
   ```powershell
   cd bounce-boss
   node server.js
   ```

2. Process Management in PowerShell
   - Use `Get-Process` instead of Unix-style commands
   - Correct way to kill Node processes:
   ```powershell
   Get-Process -Name "node" | Stop-Process -Force
   ```

## Port Management
1. Check Port Availability
   ```powershell
   netstat -ano | findstr :3000
   ```

2. Port Conflict Resolution
   - Kill existing processes
   - Wait for TIME_WAIT state to clear
   - Consider using alternative ports if needed

## File Moving Commands
1. Copy Directory Contents in PowerShell
   ```powershell
   xcopy /E /I /Y "source\directory" "destination\directory"
   ```

## Debugging Steps
1. Check server logs for file paths
2. Verify directory structure
3. Confirm port availability
4. Check file permissions
5. Verify static file serving configuration 

## ENOENT Error Troubleshooting
1. Directory Path Verification
   - Double check the exact path in your error message
   - Ensure case sensitivity matches (Windows is case-insensitive, but best practice is to match case)
   - Use `path.resolve()` to debug absolute paths:
   ```javascript
   console.log(path.resolve(__dirname, 'public'));
   ```

2. Directory Structure Verification
   ```powershell
   # List contents of current directory
   dir
   # List contents of public directory
   dir public
   ```

3. Common ENOENT Solutions
   - Create missing directories if they don't exist:
   ```javascript
   if (!fs.existsSync(path.join(__dirname, 'public'))) {
     fs.mkdirSync(path.join(__dirname, 'public'));
   }
   ```
   - Move files to correct location:
   ```powershell
   # PowerShell
   Move-Item -Path "source\*" -Destination "public\"
   ```

4. Server.js Path Configuration
   ```javascript
   const publicPath = path.join(__dirname, 'public');
   console.log('Serving files from:', publicPath);
   app.use(express.static(publicPath));
   ```

## Server Startup Checklist
1. Directory Structure
   - Confirm server.js location in server directory
   - Verify public folder exists
   - Check all HTML files are in public folder

2. Process Management
   - Clear port 3000 before starting
   - Verify no other Node processes running
   - Check server startup logs

3. File Access
   - Verify file permissions
   - Check file paths are correct
   - Ensure no files are locked by other processes 

## PowerShell-Specific Commands
1. Directory Operations
   ```powershell
   # Create directory
   mkdir public

   # Move files
   Move-Item -Path "source.html" -Destination "public/"

   # Copy directory with contents
   xcopy /E /I /Y "source\directory" "destination\directory"

   # Remove directory (with confirmation)
   Remove-Item -Path "directory" -Recurse

   # Force remove directory
   Remove-Item -Path "directory" -Recurse -Force
   ```

2. Process Management
   ```powershell
   # Find processes using port 3000
   netstat -ano | findstr :3000

   # Kill Node.js processes
   taskkill /F /IM node.exe
   # or
   Get-Process -Name "node" | Stop-Process -Force

   # Wait for TIME_WAIT state to clear
   timeout /t 5
   ```

## Common Error Solutions
1. EADDRINUSE (Port 3000 in use)
   ```powershell
   # Check what's using the port
   netstat -ano | findstr :3000
   
   # Kill the process
   Get-Process -Name "node" | Stop-Process -Force
   
   # Wait for TIME_WAIT state
   timeout /t 5
   ```

2. ENOENT (No such file or directory)
   - Verify directory structure:
   ```powershell
   dir
   dir public
   ```
   - Create missing directory:
   ```powershell
   mkdir public
   ```
   - Move files to public:
   ```powershell
   Move-Item -Path "*.html" -Destination "public/"
   ```

3. Permission Denied
   - Run PowerShell as administrator
   - Check file/directory permissions
   - Close any programs using the files
   - Use -Force flag when necessary:
   ```powershell
   Remove-Item -Path "directory" -Recurse -Force
   ``` 