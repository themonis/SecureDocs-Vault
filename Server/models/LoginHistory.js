const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Can be null for failed login attempts where user doesn't exist
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    method: { type: String, default: "Email/Password" },
    location: {
      type: String,
      default: "Unknown",
    },
    userAgent: {
      type: String,
      default: "Unknown",
    },
    success: {
      type: Boolean,
      required: true,
      default: false,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    sessionId: {
      type: String,
      required: false, // Optional: for session tracking
    },
    logoutTime: {
      type: Date,
      required: false, // Optional: when user logs out
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Indexes for better query performance
loginHistorySchema.index({ userId: 1, loginTime: -1 });
loginHistorySchema.index({ email: 1, loginTime: -1 });
loginHistorySchema.index({ ipAddress: 1 });
loginHistorySchema.index({ success: 1, loginTime: -1 });

// Virtual for session duration
loginHistorySchema.virtual("sessionDuration").get(function () {
  if (this.logoutTime) {
    return Math.round((this.logoutTime - this.loginTime) / (1000 * 60)); // Duration in minutes
  }
  return null;
});

// Method to format device info from user agent
loginHistorySchema.methods.getDeviceInfo = function () {
  const userAgent = this.userAgent.toLowerCase();

  // Detect browser
  let browser = "Unknown";
  if (userAgent.includes("chrome")) browser = "Chrome";
  else if (userAgent.includes("firefox")) browser = "Firefox";
  else if (userAgent.includes("safari")) browser = "Safari";
  else if (userAgent.includes("edge")) browser = "Edge";

  // Detect OS
  let os = "Unknown";
  if (userAgent.includes("windows")) os = "Windows";
  else if (userAgent.includes("mac")) os = "macOS";
  else if (userAgent.includes("linux")) os = "Linux";
  else if (userAgent.includes("android")) os = "Android";
  else if (userAgent.includes("ios")) os = "iOS";

  return { browser, os };
};

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
