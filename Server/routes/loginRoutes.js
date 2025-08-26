const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// ✅ FIXED: Import your actual middleware
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Log login attempt (called during login process)
router.post("/log-login", loginController.logLoginAttempt);

// Get current user's login history (protected route)
router.get(
  "/my-login-history",
  authMiddleware,
  loginController.getMyLoginHistory
);

// ✅ NEW: Add route for recent activity
router.get(
  "/recent-activity",
  authMiddleware,
  loginController.getRecentActivity
);

// ✅ NEW: Add route for login statistics
router.get("/login-stats", authMiddleware, loginController.getLoginStats);

// Admin route for all login history
router.get(
  "/all-login-history",
  authMiddleware,
  roleMiddleware(["Admin"]),
  loginController.getAllLoginHistory
);

router.get(
  "/admin-login-stats",
  authMiddleware,
  roleMiddleware(["Admin"]),
  loginController.getAdminLoginStats
);

router.get(
  "/failed-logins",
  authMiddleware,
  roleMiddleware(["Admin"]),
  loginController.getFailedLoginAttempts
);

module.exports = router;
