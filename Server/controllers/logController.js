const AccessLog = require("../models/AccessLog");

exports.getMyAccessLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const logs = await AccessLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("file", "originalName")
      .select("file status ipAddress createdAt location method");

    const formatted = logs.map((log) => ({
      fileName: log.file?.originalName || "Deleted file",
      status: log.status,
      ipAddress: log.ipAddress,
      downloadTime: log.createdAt, // ✅ Use createdAt as downloadTime
      downloadedAt: log.createdAt, // Keep this for backward compatibility
      createdAt: log.createdAt, // Add this for frontend
      location: log.location || "Unknown",
      method: log.method || "Unknown",
    }));

    // ✅ Return as 'downloads' to match your Analytics component expectation
    res.status(200).json({
      success: true,
      downloads: formatted, // Changed from 'logs' to 'downloads'
    });
  } catch (error) {
    console.error("Error fetching access logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};

//get all logs Admin only

exports.getAllAccessLogs = async (req, res) => {
  try {
    const logs = await AccessLog.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("file", "originalName")
      .select(
        "file fileNameSnapshot status ipAddress createdAt location user method userAgent"
      );

    const formattedLogs = logs.map((log) => {
      const user = log.user;
      const file = log.file;

      return {
        user: user?.name || user?.email || "Unknown",
        email: user?.email || "N/A",
        fileName: file?.originalName || log.fileNameSnapshot || "Deleted file",
        ipAddress: log.ipAddress || "Unknown",
        status: log.status,
        downloadedAt: log.createdAt,
        location: log.location || "Unknown",
        downloadMethod: log.method || (user ? "Authenticated" : "Public"),
        userAgent: log.userAgent || "Not recorded",
      };
    });

    res.status(200).json({ success: true, logs: formattedLogs });
  } catch (err) {
    console.error("getAllAccessLogs error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch access logs" });
  }
};
