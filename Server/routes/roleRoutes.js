const express = require("express");
const router = express.Router();

const {
  submitRoleRequest,
  getPendingRequests,
  approveOrRejectRequest,
} = require("../controllers/roleController");

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// Route 1: Submit role request (Guests)
router.post("/request", auth, submitRoleRequest);

// Route 2: View all pending requests (Admins only)
router.get("/pending", auth, role(["Admin"]), getPendingRequests);

// Route 3: Approve or Reject a request (Admins only)
router.post("/handle", auth, role(["Admin"]), approveOrRejectRequest);

module.exports = router;
