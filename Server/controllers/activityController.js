// controllers/activityController.js
const UserActivity = require("../models/UserActivity");

const AccessLog = require("../models/AccessLog");

// GET /api/activities/my
// GET /api/activities/my
// controllers/activityController.js
exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    const activities = await UserActivity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("file", "originalName") // populate file name if present
      .select("action details file ipAddress createdAt"); // select only useful fields

    const formattedActivities = activities.map((activity) => ({
      action: activity.action,
      details: activity.details || "",
      fileName: activity.file?.originalName || "N/A",
      ipAddress: activity.ipAddress || "Unknown",
      createdAt: activity.createdAt, // ✅ Changed from 'performedAt'
      timestamp: activity.createdAt, // ✅ Add this for backward compatibility
      performedAt: activity.createdAt, // ✅ Keep this for other components
    }));

    res.status(200).json({
      success: true,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("getMyActivities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user activity",
    });
  }
};

// GET /api/activities/all – Admin Only
// GET /api/activities/all – Admin Only
// GET /api/activities/all – Admin Only
// controllers/activityController.js

exports.getAllActivities = async (req, res) => {
  try {
    // 1. Fetch general activities from UserActivity
    const activities = await UserActivity.find()
      .populate("user", "name email")
      .populate("file", "originalName")
      .sort({ createdAt: -1 })
      .limit(100);

    // 2. Format the general activity data
    const formattedActivities = activities.map((act) => ({
      type: "Activity",
      user: act.user?.name || "Unknown",
      email: act.user?.email || "N/A",
      action: act.action,
      fileName: act.file?.originalName || "N/A",
      ipAddress: act.ipAddress || "N/A",
      location: "N/A", // Not available for general activities
      userAgent: "N/A", // Not available for general activities
      time: act.createdAt,
    }));

    // 3. Fetch download logs from AccessLog (this has the fields you want)
    const AccessLog = require("../models/AccessLog");
    const downloadLogs = await AccessLog.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    // 4. Format the download log data
    const formattedLogs = downloadLogs.map((log) => ({
      type: "Download",
      user: log.user?.name || "Public Download",
      email: log.user?.email || "N/A",
      action: `Download ${log.status}`,
      fileName: log.fileNameSnapshot, // This field exists here
      ipAddress: log.ipAddress || "N/A",
      location: log.location || "Unknown", // This field exists here
      userAgent: log.userAgent || "Unknown", // This field exists here
      time: log.createdAt,
    }));

    // 5. Combine the two arrays into a single timeline
    const timeline = [...formattedActivities, ...formattedLogs];

    // 6. Sort the final timeline chronologically
    timeline.sort((a, b) => new Date(b.time) - new Date(a.time));

    // 7. Send the combined and sorted result
    res.status(200).json({
      success: true,
      activities: timeline.slice(0, 200), // Ensure final result is limited
    });
  } catch (error) {
    console.error("getAllActivities error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch activities" });
  }
};

exports.logActivityManually = async (req, res) => {
  try {
    const { action, file, details } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: "Action is required to log activity.",
      });
    }

    const activity = await UserActivity.create({
      user: req.user.id,
      action,
      file: file || null,
      details: details || "",
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, activity });
  } catch (err) {
    console.error("logActivityManually error:", err.message);
    res.status(500).json({ success: false, message: "Failed to log activity" });
  }
};
