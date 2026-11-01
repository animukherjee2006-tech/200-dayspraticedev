const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [{ googleId: profile.id }, { Email: email }] 
        });

        if (user) {
            // Google ID link karein agar normal email se pehle register kiya tha
            if (!user.googleId) {
                user.googleId = profile.id;
                user.isVerified = true; 
                await user.save();
            }
            return done(null, user);
        }

        // New user creation for Google Sign-up
        user = new User({
            Username: profile.displayName,
            Email: email,
            googleId: profile.id,
            isVerified: true
        });

        await user.save();
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
  }
));
