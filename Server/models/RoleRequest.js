const mongoose = require("mongoose");

const roleRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // ✅ REMOVED: unique: true constraint - users should be able to request new roles
    },
    requestedRole: {
      type: String,
      enum: ["User", "Author", "Admin"],
      required: true,
    },
    reason: {
      type: String,
      required: false,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who approved/rejected
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ✅ BETTER APPROACH: Create compound index to allow only one PENDING request per user
roleRequestSchema.index(
  { user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "Pending" },
  }
);

module.exports = mongoose.model("RoleRequest", roleRequestSchema);
