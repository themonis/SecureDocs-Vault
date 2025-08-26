// config/passport-setup.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // --- THIS IS THE NEW, CORRECTED LOGIC ---

        // 1. Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // If they exist, we're done.
          return done(null, user);
        }

        // 2. If not, check if a user exists with this email address
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If they exist, it means they signed up with email/password.
          // Link their Google ID to their existing account.
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // 3. If the user is truly brand new, create a new record
        const newUser = await new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          role: "Guest",
        }).save();

        done(null, newUser);
      } catch (error) {
        done(error, false);
      }
    }
  )
);
