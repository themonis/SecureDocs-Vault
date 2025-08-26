const express = require("express");
const router = express.Router();
const { requestPasswordReset, resetPassword } = require("../controllers/passwordResetController");

// Request password reset
router.post("/forgot-password", requestPasswordReset);

// Reset password with token
router.post("/reset-password", resetPassword);

module.exports = router;
