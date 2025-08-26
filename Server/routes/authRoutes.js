const express = require("express");
const router = express.Router();
const authController = require("../controllers/Auth");
const authMiddleware = require("../middlewares/authMiddleware");
const { loginWithOTPRequest, verifyLoginOTP } = require("../controllers/Auth");
const { authLimiter } = require("../middlewares/rateLimiter");
const jwt = require("jsonwebtoken");
const passport = require("passport"); // Added passport
const logLoginAttempt = require("../controllers/loginController");
// This line executes the passport configuration
require("../config/passport-setup");
const LoginHistory = require("../models/LoginHistory");
const geoip = require("geoip-lite");
const loginController = require("../controllers/loginController");

// --- Existing Email & OTP Routes ---
router.post("/send-otp", authLimiter, authController.sendOTP);
router.post("/signup", authLimiter, authController.signUp);
router.post("/2fa/login/request", authLimiter, loginWithOTPRequest);
router.post("/2fa/login/verify", authLimiter, verifyLoginOTP);

// --- New Google Social Login Routes ---

// Route to initiate Google authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route Google redirects to after successful login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login-failed",
  }),
  async (req, res) => {
    try {
      // On success, create JWT for the user
      const payload = {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      // ✅ TRY to log login attempt, but don't let it break OAuth
      try {
        await loginController.logLoginAttempt(req, null, {
          userId: req.user._id,
          email: req.user.email,
          success: true,
          method: "Google OAuth",
          ipAddress: req.ip, // ✅ Add this explicitly
          userAgent: req.get("User-Agent"),
        });
        console.log(`🔐 Google OAuth login tracked: ${req.user.email}`);
      } catch (trackingError) {
        console.error("Login tracking failed (non-critical):", trackingError);
        // Continue with OAuth success even if tracking fails
      }

      console.log(`✅ Google OAuth login successful: ${req.user.email}`);

      // Redirect to your frontend with the token
      res.redirect(`http://localhost:3000/auth/success?token=${token}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("http://localhost:3000/login?error=oauth_failed");
    }
  }
);

router.get("/login-failed", async (req, res) => {
  // ✅ Log failed OAuth attempt (we don't have user info, so just IP tracking)
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";
    const userAgent = req.get("User-Agent") || "Unknown";
    const geo = geoip.lookup(ipAddress);
    const location = geo ? `${geo.city}, ${geo.country}` : "Unknown";

    const loginEntry = new LoginHistory({
      userId: null,
      email: "oauth_failed@unknown.com", // Placeholder for failed OAuth
      ipAddress: ipAddress,
      location: location,
      userAgent: userAgent,
      success: false,
      loginTime: new Date(),
    });

    await loginEntry.save();
  } catch (error) {
    console.error("Error logging failed OAuth:", error);
  }

  res.redirect("http://localhost:3000/login?error=oauth_failed");
});

// router.get("/verify-token", authLimiter, authController.verifyToken);

router.get("/verify-token", authMiddleware, authController.verifyToken);

module.exports = router;
