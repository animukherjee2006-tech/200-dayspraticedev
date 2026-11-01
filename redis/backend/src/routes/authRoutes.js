const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controller/auth.controller'); // Update path to your controller file

// 1. Initial Registration Route (Generates OTP & Caches to Redis)
router.post('/register', authController.register);

// 2. OTP Verification & Final Account Creation Route
router.post('/verify-otp', authController.verifyOTP);

// 3. Google OAuth Initialization Route
// (Triggers passport authentication redirect to Google)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 4. Google OAuth Callback Route
// (Handles response from Google and fires your controller logic)
router.get(
    '/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }), 
    authController.googleCallback
);

module.exports = router;