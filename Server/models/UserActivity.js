// models/UserActivity.js
const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "upload",
        "delete",
        "share",
        "download", // ✅ ADD this line
        "login",
        "logout",
        "unauthorized",
      ],
      required: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
    ipAddress: String,
    details: String, // optional description
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserActivity", userActivitySchema);
