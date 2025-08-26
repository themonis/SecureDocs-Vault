const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: false, // make it optional to handle deleted files
    },
    fileNameSnapshot: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    ipAddress: String,
    status: {
      type: String,
      enum: ["success", "fail"],
      default: "success",
    },
    location: String,
    method: {
      type: String,
      enum: ["Authenticated", "Public"],
      default: "Public",
    },
    downloadMethod: {
      type: String,
      enum: ["Authenticated", "Public"],
      default: "Public",
    },
    userAgent: {
      type: String,
      default: "N/A",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessLog", accessLogSchema);
