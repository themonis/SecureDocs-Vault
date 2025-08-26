const cron = require("node-cron");
const File = require("../models/File");
const fs = require("fs");
const path = require("path");

function deleteFileAndRecord(doc) {
  const filePath = path.join(__dirname, "..", doc.encryptedPath);
  fs.unlink(filePath, (err) => {
    if (err) console.error(`❌ Failed to delete file: ${filePath}`);
    else console.log(`🧹 Deleted expired file: ${filePath}`);
  });
}

const cleanupExpiredFiles = () => {
  cron.schedule("0 3 * * *", async () => {
    // Runs every day at 3:00 AM
    console.log("🕒 Running expired file cleanup...");

    try {
      const expiredFiles = await File.find({
        autoDelete: true,
        expiresAt: { $lte: new Date() },
      });

      for (const doc of expiredFiles) {
        deleteFileAndRecord(doc);
        await File.deleteOne({ _id: doc._id });
      }

      console.log(`✅ Cleanup complete. Deleted ${expiredFiles.length} files.`);
    } catch (err) {
      console.error("❌ Cleanup error:", err);
    }
  });
};

module.exports = cleanupExpiredFiles;
