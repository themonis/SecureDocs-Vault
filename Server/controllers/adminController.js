const User = require("../models/User");
const File = require("../models/File");
const AccessLog = require("../models/AccessLog");

exports.getAdminStats = async (req, res) => {
  try {
    // 1. Basic counts
    const [totalUsers, totalFiles, expiringFiles] = await Promise.all([
      User.countDocuments(),
      File.countDocuments(),
      File.countDocuments({
        expiresAt: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next 7 days
        },
      }),
    ]);

    // 2. Total storage in MB (make sure to use correct field: size)
    const totalStorageAgg = await File.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$size" } } }, // <- fixed field
    ]);
    const totalStorageMB = totalStorageAgg[0]
      ? +(totalStorageAgg[0].totalBytes / (1024 * 1024)).toFixed(2)
      : 0;

    // 3. Most downloaded file
    const mostDownloadedAgg = await AccessLog.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: "$file", downloads: { $sum: 1 } } },
      { $sort: { downloads: -1 } },
      { $limit: 1 },
    ]);

    let mostDownloaded = null;
    if (mostDownloadedAgg.length > 0) {
      const fileDoc = await File.findById(mostDownloadedAgg[0]._id);
      if (fileDoc) {
        mostDownloaded = {
          fileName: fileDoc.originalName || "Unnamed File",
          downloads: mostDownloadedAgg[0].downloads,
        };
      }
    }

    // 4. Daily uploads last 7 days
    const date7DaysAgo = new Date();
    date7DaysAgo.setDate(date7DaysAgo.getDate() - 6);
    const dailyUploadsAgg = await File.aggregate([
      { $match: { createdAt: { $gte: date7DaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates with 0
    const dailyUploads = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      const found = dailyUploadsAgg.find((d) => d._id === dateStr);
      dailyUploads.push({ _id: dateStr, count: found ? found.count : 0 });
    }

    // 5. Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    // 6. Recent uploads
    const recentUploads = await File.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("originalName createdAt");

    // 7. Recent downloads
    const recentDownloads = await AccessLog.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("fileNameSnapshot createdAt ipAddress location");

    // 8. Respond without changing keys
    res.status(200).json({
      success: true,
      totalUsers,
      totalFiles,
      totalStorageMB,
      filesExpiringSoon: expiringFiles,
      mostDownloaded,
      dailyUploads,
      usersByRole,
      recentUploads,
      recentDownloads,
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin stats" });
  }
};
