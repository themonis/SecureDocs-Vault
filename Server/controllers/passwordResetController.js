const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mailSender = require("../utils/mailSender"); // ✅ Use your existing mailSender

// 1. Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email address",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token and save to user
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    // ✅ Use your existing email template style
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - SecureDocs</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔒 SecureDocs</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hello ${
              user.name || "there"
            } 👋,</h2>
            
            <p style="font-size: 16px; margin: 20px 0;">You requested a password reset for your <strong>SecureDocs</strong> account.</p>
            
            <p style="font-size: 16px; margin: 20px 0;">Click the button below to reset your password:</p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetURL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: transform 0.2s;">
                🔑 Reset Password
              </a>
            </div>
            
            <!-- Warning Box -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⏰ Important:</strong> This reset link will expire in <strong>10 minutes</strong> for security reasons.
              </p>
            </div>
            
            <!-- Alternative Link -->
            <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6c757d;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0 0; word-break: break-all; font-size: 14px; color: #007bff;">
                ${resetURL}
              </p>
            </div>
            
            <p style="font-size: 16px; margin: 30px 0 10px 0;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong>SecureDocs Team</strong>
            </p>
          </div>
          
          <!-- Bottom Footer -->
          <div style="background: #f8f9fa; text-align: center; padding: 20px; color: #666; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">SecureDocs © ${new Date().getFullYear()}</p>
            <p style="margin: 5px 0 0 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // ✅ Use your existing mailSender function
    const emailSent = await mailSender(
      user.email,
      "🔒 SecureDocs - Password Reset Request",
      htmlContent
    );

    if (emailSent) {
      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } else {
      throw new Error("Failed to send email");
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending password reset email",
    });
  }
};

// 2. Reset password with token (same as before)
exports.resetPassword = async (req, res) => {
  try {
    const { token, userId, newPassword, confirmPassword } = req.body;

    if (!token || !userId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};
