const User = require("../models/User");
const OTP = require("../models/OTP");
const LoginHistory = require("../models/LoginHistory"); // ✅ NEW: Import login history model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passwordValidator = require("password-validator");
const mailSender = require("../utils/mailSender");
const { generateOTPEmail } = require("../utils/emailTemplates");
const geoip = require("geoip-lite"); // ✅ NEW: For location tracking

require("dotenv").config();

const passwordSchema = new passwordValidator();
passwordSchema
  .is()
  .min(8)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols(1)
  .has()
  .not()
  .spaces();

// ✅ NEW: Helper function to log login attempts
const logLoginAttempt = async (req, loginData) => {
  try {
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.headers["x-forwarded-for"] ||
      "Unknown";
    const userAgent = req.get("User-Agent") || "Unknown";

    // Get location from IP
    const geo = geoip.lookup(ipAddress);
    const location = geo ? `${geo.city}, ${geo.country}` : "Unknown";

    // Create login history entry
    const loginEntry = new LoginHistory({
      userId: loginData.userId || null,
      email: loginData.email,
      ipAddress: ipAddress,
      location: location,
      userAgent: userAgent,
      success: loginData.success,
      loginTime: new Date(),
    });

    await loginEntry.save();
    console.log(
      `🔐 Login attempt logged: ${loginData.email} - ${
        loginData.success ? "SUCCESS" : "FAILED"
      }`
    );
  } catch (error) {
    console.error("Error logging login attempt:", error);
    // Don't fail the login process if logging fails
  }
};

// Generate and send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate unique OTP
    let otp = Math.floor(100000 + Math.random() * 900000);
    let existingOtp = await OTP.findOne({ code: otp });
    while (existingOtp) {
      otp = Math.floor(100000 + Math.random() * 900000);
      existingOtp = await OTP.findOne({ code: otp });
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    await OTP.create({ email, code: otp, expiresAt });

    // Send OTP email
    const emailSent = await mailSender(
      email,
      "Your SecureDocs OTP",
      generateOTPEmail(otp)
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP email" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.error("❌ Error in sendOTP:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Register user (Sign Up)
exports.signUp = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, otp } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirmPassword || !otp) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!passwordSchema.validate(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password is too weak. It must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // Find latest OTP for this email
    const recentOTP = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    if (recentOTP.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    // Validate OTP
    const storedOTP = recentOTP[0];
    if (storedOTP.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (otp !== storedOTP.code) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: username,
      email,
      passwordHash: hashedPassword,
      role: "Guest", // Default as Guest, upgradeable later
    });

    // ✅ NEW: Log successful account creation (optional)
    await logLoginAttempt(req, {
      userId: user._id,
      email: user.email,
      success: true, // Account creation counts as successful "first login"
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error in signUp:", error);
    return res.status(500).json({
      success: false,
      message: "User could not be registered. Please try again.",
    });
  }
};

// Login with OTP 2FA - Step 1: Verify email/password → Send OTP
exports.loginWithOTPRequest = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // ✅ NEW: Log failed login attempt (user not found)
      await logLoginAttempt(req, {
        userId: null,
        email: email,
        success: false,
      });

      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      // ✅ NEW: Log failed login attempt (wrong password)
      await logLoginAttempt(req, {
        userId: user._id,
        email: email,
        success: false,
      });

      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Generate OTP
    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Ensure uniqueness (optional)
    let existingOtp = await OTP.findOne({ code: otpCode });
    while (existingOtp) {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingOtp = await OTP.findOne({ code: otpCode });
    }

    // Set expiry (e.g., 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP in DB
    await OTP.create({
      email: user.email,
      code: otpCode,
      expiresAt,
    });

    // Send OTP via email
    await mailSender(
      user.email,
      "Your SecureDocs Login OTP",
      generateOTPEmail(otpCode)
    );

    // Note: We don't log successful login here yet, as this is just step 1
    // The actual login success will be logged in verifyLoginOTP

    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
      email: user.email,
      otpCode,
    });
  } catch (error) {
    console.error("2FA Step 1 error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process login",
    });
  }
};

// Verify OTP and complete login
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // ✅ NEW: Log failed login attempt (user not found during OTP verification)
      await logLoginAttempt(req, {
        userId: null,
        email: email,
        success: false,
      });

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get latest OTP for the user
    const recentOTP = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!recentOTP || recentOTP.length === 0) {
      // ✅ NEW: Log failed login attempt (OTP not found)
      await logLoginAttempt(req, {
        userId: user._id,
        email: email,
        success: false,
      });

      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    const storedOTP = recentOTP[0];
    const now = new Date();

    if (storedOTP.code !== otp) {
      // ✅ NEW: Log failed login attempt (invalid OTP)
      await logLoginAttempt(req, {
        userId: user._id,
        email: email,
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (now > storedOTP.expiresAt) {
      // ✅ NEW: Log failed login attempt (expired OTP)
      await logLoginAttempt(req, {
        userId: user._id,
        email: email,
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: "OTP expired",
      });
    }

    // ✅ SUCCESS: Log successful login
    await logLoginAttempt(req, {
      userId: user._id,
      email: email,
      success: true,
    });

    // Generate JWT
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    // Remove OTP from DB
    await OTP.deleteMany({ email }); // Optional

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    console.error("verifyLoginOTP error:", err);
    res.status(500).json({
      success: false,
      message: "Login verification failed",
    });
  }
};

// Verify Token (unchanged)
exports.verifyToken = async (req, res) => {
  // If the authMiddleware passes, it means the token is valid.
  // The user's decoded token payload is in req.user.
  res.status(200).json({ success: true, user: req.user });
};

// ✅ NEW: Optional logout function with session tracking
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Find the most recent successful login for this user and mark logout time
      const recentLogin = await LoginHistory.findOne({
        userId: userId,
        success: true,
        logoutTime: null,
      }).sort({ loginTime: -1 });

      if (recentLogin) {
        recentLogin.logoutTime = new Date();
        await recentLogin.save();
        console.log(`🔐 Logout tracked for user: ${req.user.email}`);
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
