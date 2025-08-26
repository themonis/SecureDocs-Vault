// utils/activityLogger.js
const UserActivity = require("../models/UserActivity");

exports.logUserActivity = async ({
  user,
  action,
  file = null,
  ipAddress = null,
  details = "",
}) => {
  try {
    if (!user || !action) {
      console.warn("logUserActivity: Missing required user or action");
      return;
    }

    const newActivity = {
      user,
      action,
      file,
      ipAddress,
      details,
    };

    await UserActivity.create(newActivity);
  } catch (err) {
    console.error("Activity logging failed:", err.message);
  }
};
