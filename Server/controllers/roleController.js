const RoleRequest = require("../models/RoleRequest");
const User = require("../models/User");

// 1. Submit role request (Guest user)
exports.submitRoleRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestedRole, reason } = req.body;

    console.log("Received role request:", { userId, requestedRole, reason });

    // Validate requestedRole
    if (!["User", "Author"].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role requested. Valid roles: User, Author",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Check user role validation
    if (
      user.role === requestedRole ||
      (user.role === "Author" && requestedRole === "User") ||
      user.role === "Admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have this role or higher",
      });
    }

    // Check for existing pending request
    const existingRequest = await RoleRequest.findOne({
      user: userId,
      status: "Pending",
    });
    console.log("Existing pending request:", existingRequest);

    if (existingRequest) {
      console.log("❌ User already has pending request");
      return res.status(400).json({
        success: false,
        message: "You already have a pending role request",
      });
    }

    // Create new request
    console.log("Attempting to create role request...");
    const request = await RoleRequest.create({
      user: userId,
      requestedRole,
      reason: reason || "",
      status: "Pending",
    });
    console.log("✅ Role request created successfully:", request._id);

    // ✅ CRITICAL: Populate the user data and send response
    await request.populate("user", "name email role");

    // ✅ SEND RESPONSE BACK TO FRONTEND
    return res.status(200).json({
      success: true,
      message: "Role request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("❌ submitRoleRequest error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    if (error.code === 11000) {
      console.log("Duplicate key error:", error.keyPattern);
      return res.status(400).json({
        success: false,
        message: "You already have a pending role request",
      });
    }

    if (error.name === "ValidationError") {
      console.log("Validation errors:", Object.keys(error.errors));
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${errors.join(", ")}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 2. Get all pending requests (Admin only)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: "Pending" })
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("getPendingRequests error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 3. Approve or reject a request (Admin only)
exports.approveOrRejectRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { requestId, action } = req.body;

    console.log("Processing role request:", { requestId, action, adminId }); // Debug log

    // Validate action
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'approve' or 'reject'",
      });
    }

    // Find the request
    const request = await RoleRequest.findById(requestId).populate("user");
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Role request not found",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    if (action === "approve") {
      // Update user role
      await User.findByIdAndUpdate(request.user._id, {
        role: request.requestedRole,
      });

      // Update request status
      await RoleRequest.findByIdAndUpdate(requestId, {
        status: "Approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      });

      console.log(
        `Role approved: User ${request.user.email} upgraded to ${request.requestedRole}`
      );
    } else {
      // Update request status to rejected
      await RoleRequest.findByIdAndUpdate(requestId, {
        status: "Rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      });

      console.log(
        `Role rejected: User ${request.user.email} request for ${request.requestedRole}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Role request ${action}d successfully`,
      action,
    });
  } catch (error) {
    console.error("approveOrRejectRequest error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
