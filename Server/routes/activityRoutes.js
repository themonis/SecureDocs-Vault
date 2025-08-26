const express = require("express");
const router = express.Router();

const {
  getMyActivities,
  getAllActivities,
  logActivityManually, // make sure this exists in activityController.js
} = require("../controllers/activityController");

const authMiddleware = require("../middlewares/authMiddleware");

const roleMiddleware = require("../middlewares/roleMiddleware");
const isAdmin = roleMiddleware(["Admin"]);

// ✅ Route to log activity (controller version)
router.post("/log", authMiddleware, logActivityManually);

// 👤 User timeline
router.get("/my-activity", authMiddleware, getMyActivities);

// 👑 Admin: All user activities
router.get("/all", authMiddleware, isAdmin, getAllActivities);

module.exports = router;
