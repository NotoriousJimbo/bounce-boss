# Known Issues

## Admin Dashboard Access

There are two ways to access the admin dashboard:
1. Through the main route: http://localhost:3001/admin/dashboard.html
2. Through the login page: http://localhost:3001/admin/login.html

## VSCode Tab Cleanup Needed

The VS Code tabs show references to files in a `bounce-boss` directory, but this directory doesn't actually exist on the filesystem. These tabs appear to be from a previous project state or configuration.

### Action Items:
1. Close the VS Code tabs referencing non-existent files in the `bounce-boss` directory
2. Use only the files in the main `public` and `server` directories

## Server Configuration
The server is correctly configured to serve static files from the `public` directory. The admin routes are properly set up to serve files from `public/admin/`.

```javascript
// Admin routes in server.js
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(publicPath, 'admin/dashboard.html'));
});
```

The server serves static files from:
- `public/` - for all website files including admin pages
- `public/admin/` - for admin-specific pages
- `public/js/` - for JavaScript files including admin.js

## Admin Authentication
Authentication for admin pages is handled through:
- Login API: `/api/auth/login`
- JWT tokens stored in localStorage
- Protected API endpoints in `/api/bookings` and other routes
