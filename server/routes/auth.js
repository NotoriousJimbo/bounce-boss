const express = require('express');
const router = express.Router();
const { 
  login, 
  register, 
  verifyToken, 
  isAdmin, 
  requestPasswordReset, 
  verifyResetToken, 
  resetPassword 
} = require('../middleware/auth');

// Login route
router.post('/login', login);

// Register route (admin only)
router.post('/register', verifyToken, isAdmin, register);

// Verify token route
router.get('/verify', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Password reset routes
router.post('/reset-password', requestPasswordReset);
router.get('/reset-password/:token', verifyResetToken);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
