// fileController.js
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");
const { createReadStream, unlinkSync, unlink } = require("fs");
const User = require("../models/User");

const File = require("../models/File");
const AccessLog = require("../models/AccessLog");
const { encryptFile, decryptFile } = require("../utils/cryptoHelper");
const generateUUID = require("../utils/generateUUID");
const { logUserActivity } = require("../utils/activityLogger");

const baseUrl = process.env.BASE_URL || "http://localhost:5000";

const { getLocationFromIP } = require("../utils/locationService");

const https = require("https"); // Add this at the top with other requires

// Upload + Encrypt File
// Upload + Encrypt File
exports.uploadEncryptedFile = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user;
    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const uuid = generateUUID();
    const encryptedFileName = `${uuid}-${file.originalname}.enc`;
    const encryptedFilePath = path.join(
      __dirname,
      "../uploads",
      encryptedFileName
    );
    await encryptFile(file.path, encryptedFilePath);
    fs.unlinkSync(file.path);

    let expiresAt = null;
    let autoDelete = false;
    if (req.body.expiresInDays) {
      const days = parseInt(req.body.expiresInDays);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date(Date.now() + days * 86400000);
        autoDelete = true;
      }
    }

    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(",").map((tag) => tag.trim());
    }

    // Debug log to verify file size
    console.log("📁 File upload debug:", {
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    const fileDoc = await File.create({
      uuid,
      originalName: file.originalname,
      size: file.size, // ← Fixed: Changed from 'fileSize' to 'size'
      mimeType: file.mimetype, // Note: Your schema doesn't have mimeType field either
      encryptedPath: encryptedFilePath,
      owner: user.id,
      expiresAt,
      autoDelete,
      tags,
    });

    await logUserActivity({
      user: user.id,
      action: "upload",
      file: fileDoc._id,
      ipAddress: req.ip,
      details: `Uploaded \"${file.originalname}\"`,
    });

    console.log("✅ File saved to database with size:", fileDoc.size);

    return res.status(201).json({
      success: true,
      message: "File uploaded and encrypted successfully",
      fileId: uuid,
      downloadLink: `/api/files/download/${uuid}`,
      expiresAt: autoDelete ? expiresAt : null,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload file" });
  }
};

// Download + Decrypt File
// controllers/fileController.js

// This is the complete, corrected function
exports.downloadDecryptedFile = async (req, res) => {
  try {
    const { uuid } = req.params;
    const user = req.user;

    const fileDoc = await File.findOne({ uuid });

    // Get IP address
    let ip = (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      ""
    )
      .split(",")[0]
      .trim();

    // Replace the hardcoded IP logic with dynamic public IP detection:
    if (
      !ip ||
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip?.includes("localhost") ||
      ip?.startsWith("192.168.") ||
      ip?.startsWith("10.") ||
      ip?.startsWith("172.")
    ) {
      try {
        console.log(
          "🔍 [DEBUG] Detected local/private IP, fetching public IP..."
        );

        const publicIP = await new Promise((resolve, reject) => {
          const req = https.get("https://api.ipify.org?format=json", (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.ip);
              } catch (e) {
                reject(e);
              }
            });
          });
          req.on("error", reject);
          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });

        ip = publicIP;
        console.log("🔍 [DEBUG] Successfully got public IP:", ip);
      } catch (error) {
        console.error("❌ [DEBUG] Public IP fetch failed:", error);
        ip = "Unknown";
      }
    }

    // ✅ This is the updated authorization block
    if (fileDoc) {
      const isOwner = fileDoc.owner.toString() === user.id;
      const isSharedWithUser = fileDoc.sharedWith.some(
        (sharedUserId) => sharedUserId.toString() === user.id
      );

      // If the user is NOT the owner AND is NOT in the shared list, deny access
      if (!isOwner && !isSharedWithUser) {
        await AccessLog.create({
          file: fileDoc._id,
          fileNameSnapshot: fileDoc.originalName,
          user: user.id,
          ipAddress: ip,
          status: "fail",
          method: "Authenticated",
          location: "Unauthorized access",
          userAgent: req.headers["user-agent"] || "N/A",
        });
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized access" });
      }
    } else {
      // If the file doesn't exist at all
      await AccessLog.create({
        file: null,
        fileNameSnapshot: "Unknown",
        user: user.id,
        ipAddress: ip,
        status: "fail",
        method: "Authenticated",
        location: "File not found",
        userAgent: req.headers["user-agent"] || "N/A",
      });
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // ✅ CHECK DOWNLOAD LIMITS (if applicable)
    if (fileDoc.maxDownloads && fileDoc.downloadCount >= fileDoc.maxDownloads) {
      await AccessLog.create({
        file: fileDoc._id,
        fileNameSnapshot: fileDoc.originalName,
        user: user.id,
        ipAddress: ip,
        status: "fail",
        method: "Authenticated",
        location: "Download limit exceeded",
        userAgent: req.headers["user-agent"] || "N/A",
      });

      return res.status(429).json({
        success: false,
        message: "Download limit exceeded",
      });
    }

    // ✅ CHECK FILE EXPIRATION
    if (fileDoc.expiresAt && new Date() > fileDoc.expiresAt) {
      await AccessLog.create({
        file: fileDoc._id,
        fileNameSnapshot: fileDoc.originalName,
        user: user.id,
        ipAddress: ip,
        status: "fail",
        method: "Authenticated",
        location: "File expired",
        userAgent: req.headers["user-agent"] || "N/A",
      });

      return res.status(410).json({
        success: false,
        message: "File has expired",
      });
    }

    // Decrypt to temp path
    const tempPath = path.join(
      __dirname,
      "../temp",
      `${uuid}-decrypted-${fileDoc.originalName}`
    );

    await decryptFile(fileDoc.encryptedPath, tempPath);

    // Get location using IP
    let location;
    try {
      location = await getLocationFromIP(ip);
    } catch (locationErr) {
      console.warn("Enhanced location lookup failed:", locationErr.message);
      location = "Unknown";
    }

    // ✅ INCREMENT DOWNLOAD COUNT
    const updatedFile = await File.findByIdAndUpdate(
      fileDoc._id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    // Log success
    await AccessLog.create({
      file: fileDoc._id,
      fileNameSnapshot: fileDoc.originalName,
      user: user.id,
      ipAddress: ip,
      status: "success",
      method: "Authenticated",
      location,
      userAgent: req.headers["user-agent"] || "N/A",
    });

    // ✅ LOG USER ACTIVITY
    try {
      await logUserActivity({
        user: user.id,
        action: "download",
        file: fileDoc._id,
        ipAddress: ip,
        details: `Downloaded "${fileDoc.originalName}"`,
      });
    } catch (activityErr) {
      console.warn("Activity logging failed:", activityErr.message);
    }

    // Set headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileDoc.originalName}"`
    );
    res.setHeader(
      "Content-Type",
      fileDoc.mimeType || "application/octet-stream"
    );

    const fileStream = createReadStream(tempPath);
    fileStream.pipe(res);

    const cleanup = () => fs.existsSync(tempPath) && unlink(tempPath, () => {});
    fileStream.on("close", cleanup);
    res.on("finish", cleanup);
  } catch (error) {
    console.error("Download Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to download file" });
  }
};

// Generate Public Link
exports.generatePublicLink = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { password, downloadLimit, expiresIn, autoDelete, tags } = req.body;

    const userId = req.user.id;
    const file = await File.findOne({ uuid });

    if (!file || file.owner.toString() !== userId)
      return res.status(file ? 403 : 404).json({
        success: false,
        message: file ? "Unauthorized" : "File not found",
      });

    // Handle password protection
    if (password && password.length >= 4) {
      file.downloadPassword = await bcrypt.hash(password, 10);
      file.requiresPassword = true;
    }

    // Handle download limit
    if (downloadLimit && downloadLimit > 0) {
      file.maxDownloads = downloadLimit;
    }

    // Handle expiry time
    if (expiresIn) {
      const durationMs = parseExpiry(expiresIn);
      if (durationMs) file.expiresAt = new Date(Date.now() + durationMs);
    }

    // Auto-delete flag
    if (typeof autoDelete === "boolean") {
      file.autoDelete = autoDelete;
    }

    // Tags for organization
    if (Array.isArray(tags)) {
      file.tags = tags.map((tag) => tag.trim().toLowerCase());
    }

    // Public token
    if (!file.downloadToken) file.downloadToken = crypto.randomUUID();
    file.public = true;

    await file.save();

    const publicUrl = `${baseUrl}/api/files/public/${file.downloadToken}`;

    res.status(200).json({
      success: true,
      message: "Public link generated",
      publicLink: publicUrl, // ← Frontend expects 'publicLink'
      token: file.downloadToken, // ← Frontend expects 'token'
      requiresPassword: file.requiresPassword,
      expiresAt: file.expiresAt,
      maxDownloads: file.maxDownloads,
      tags: file.tags,
    });
  } catch (err) {
    console.error("generatePublicLink error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Helper to parse expiry duration like "2h", "3d"
function parseExpiry(duration) {
  const regex = /^(\d+)([smhd])$/;
  const match = duration.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 3600 * 1000,
    d: 86400 * 1000,
  };

  return value * multipliers[unit];
}

// Public File Download

exports.publicDownload = async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ FIX: Handle both GET (no body) and POST (with body) requests
    const password = req.body?.password || null; // Safe access to password

    // Find file by download token
    const file = await File.findOne({ downloadToken: token, public: true });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found or link expired",
      });
    }

    // Check if file is expired
    if (file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Download link has expired",
      });
    }

    // Check download limits
    if (file.maxDownloads && file.downloadCount >= file.maxDownloads) {
      return res.status(429).json({
        success: false,
        message: "Download limit exceeded",
      });
    }

    // Check if password is required
    if (file.requiresPassword && !password) {
      // If GET request and password required, return HTML form
      if (req.method === "GET") {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Password Required - SecureDocs</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 50px; 
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
                color: white; 
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container { 
                max-width: 400px; 
                width: 100%;
                padding: 30px; 
                background: rgba(255,255,255,0.1); 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
              }
              h2 { text-align: center; margin-bottom: 10px; }
              p { text-align: center; margin-bottom: 20px; opacity: 0.8; }
              .filename { 
                background: rgba(59, 130, 246, 0.2); 
                padding: 10px; 
                border-radius: 8px; 
                font-weight: bold; 
                text-align: center; 
                margin: 20px 0; 
              }
              input { 
                width: 100%; 
                padding: 12px; 
                margin: 10px 0; 
                border: 1px solid rgba(255,255,255,0.3); 
                border-radius: 8px; 
                background: rgba(255,255,255,0.1);
                color: white;
                box-sizing: border-box;
              }
              input::placeholder { color: rgba(255,255,255,0.6); }
              button { 
                width: 100%; 
                padding: 12px; 
                background: linear-gradient(135deg, #3b82f6, #6366f1); 
                color: white; 
                border: none; 
                border-radius: 8px; 
                cursor: pointer; 
                font-weight: bold;
                margin-top: 10px;
              }
              button:hover { 
                background: linear-gradient(135deg, #2563eb, #4f46e5); 
                transform: translateY(-1px);
              }
              .error { 
                color: #ef4444; 
                text-align: center; 
                margin-top: 10px; 
                display: none; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🔒 Password Required</h2>
              <p>This file is password protected. Enter the password to download:</p>
              <div class="filename">${file.originalName}</div>
              <form method="POST" action="/api/files/public/${token}">
                <input type="password" name="password" placeholder="Enter password" required>
                <button type="submit">Download File</button>
              </form>
              <div class="error" id="error"></div>
            </div>
          </body>
          </html>
        `);
      } else {
        return res.status(401).json({
          success: false,
          message: "Password required",
        });
      }
    }

    // Verify password if provided and required
    if (file.requiresPassword && password) {
      const passwordMatch = await bcrypt.compare(
        password,
        file.downloadPassword
      );
      if (!passwordMatch) {
        if (req.method === "GET") {
          return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Invalid Password - SecureDocs</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 50px; background: #1a1a1a; color: white; text-align: center; }
                .error { color: #ef4444; margin: 20px 0; }
                a { color: #3b82f6; text-decoration: none; }
              </style>
            </head>
            <body>
              <h2>❌ Invalid Password</h2>
              <p class="error">The password you entered is incorrect.</p>
              <a href="/api/files/public/${token}">← Try Again</a>
            </body>
            </html>
          `);
        } else {
          return res.status(401).json({
            success: false,
            message: "Invalid password",
          });
        }
      }
    }

    // Get IP address for logging
    let ip = (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      ""
    )
      .split(",")[0]
      .trim();

    // Decrypt and serve the file
    const tempPath = path.join(
      __dirname,
      "../temp",
      `${token}-decrypted-${file.originalName}`
    );

    await decryptFile(file.encryptedPath, tempPath);

    // Increment download count
    await File.findByIdAndUpdate(file._id, { $inc: { downloadCount: 1 } });

    // Log the public download
    // Get enhanced location for public downloads
    let location;
    try {
      location = await getLocationFromIP(ip);
      console.log(`📍 Public download location: ${location}`);
    } catch (locationErr) {
      console.warn(
        "Location lookup failed for public download:",
        locationErr.message
      );
      location = "Public Download (Location Unknown)";
    }

    // Log the public download
    await AccessLog.create({
      file: file._id,
      fileNameSnapshot: file.originalName,
      user: null, // Public download
      ipAddress: ip,
      status: "success",
      method: "Public",
      location, // ✅ Now uses enhanced location
      userAgent: req.headers["user-agent"] || "N/A",
    });

    console.log(
      `✅ Public download: ${file.originalName} (Count: ${
        file.downloadCount + 1
      })`
    );

    // Set headers and send file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.originalName}"`
    );
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");

    const fileStream = createReadStream(tempPath);
    fileStream.pipe(res);

    // Cleanup temp file
    const cleanup = () => fs.existsSync(tempPath) && unlink(tempPath, () => {});
    fileStream.on("close", cleanup);
    res.on("finish", cleanup);
  } catch (error) {
    console.error("❌ Public download error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download file",
    });
  }
};

// Toggle Public Link

exports.togglePublicLink = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { enable, maxDownloads, password } = req.body;
    const userId = req.user.id;

    const file = await File.findOne({ uuid });

    if (!file || file.owner.toString() !== userId) {
      return res.status(file ? 403 : 404).json({
        success: false,
        message: file ? "Unauthorized" : "File not found",
      });
    }

    // Check if file is expired
    if (enable && file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Cannot enable public link for an expired file",
      });
    }

    // Enable public link
    if (enable) {
      file.public = true;

      if (!file.downloadToken) {
        file.downloadToken = crypto.randomUUID();
      }

      if (typeof maxDownloads === "number") {
        file.maxDownloads = maxDownloads;
      }

      if (password && password.length >= 4) {
        file.downloadPassword = await bcrypt.hash(password, 10);
        file.requiresPassword = true;
      }
    }

    // Revoke public link
    else {
      file.public = false;
      file.downloadToken = null;
      file.downloadPassword = null;
      file.requiresPassword = false;
      file.maxDownloads = null;
    }

    await file.save();

    res.status(200).json({
      success: true,
      message: `Public link ${enable ? "enabled" : "revoked"}`,
      file: {
        uuid: file.uuid,
        public: file.public,
        maxDownloads: file.maxDownloads,
        publicUrl: file.public
          ? `${process.env.BASE_URL}/api/files/public/${file.downloadToken}`
          : null,
        requiresPassword: file.requiresPassword,
      },
    });
  } catch (error) {
    console.error("togglePublicLink error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Delete File
exports.deleteFile = async (req, res) => {
  try {
    const { uuid } = req.params;
    const userId = req.user.id;
    const file = await File.findOne({ uuid });

    if (!file || file.owner.toString() !== userId)
      return res.status(file ? 403 : 404).json({
        success: false,
        message: file ? "Unauthorized" : "File not found",
      });

    if (fs.existsSync(file.encryptedPath)) fs.unlinkSync(file.encryptedPath);
    await File.deleteOne({ _id: file._id });
    await AccessLog.deleteMany({ file: file._id });
    await logUserActivity({
      user: userId,
      action: "delete",
      file: file._id,
      ipAddress: req.ip,
      details: `Deleted \"${file.originalName}\"`,
    });

    return res
      .status(200)
      .json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Search Files by Tags
exports.searchFilesByTags = async (req, res) => {
  try {
    const { tags } = req.query;
    const userId = req.user.id;
    if (!tags)
      return res.status(400).json({ success: false, message: "Tags required" });

    const tagList = tags.split(",").map((t) => t.trim());
    const files = await File.find({
      owner: userId,
      tags: { $in: tagList },
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: files.length, files });
  } catch (error) {
    console.error("searchFilesByTags error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// Get All Unique Tags for User
exports.getUserTags = async (req, res) => {
  try {
    const userId = req.user.id;
    const tags = await File.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
          tags: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$tags" },
      { $group: { _id: null, allTags: { $addToSet: "$tags" } } },
      { $project: { _id: 0, allTags: 1 } },
    ]);

    res.status(200).json({ success: true, tags: tags[0]?.allTags || [] });
  } catch (error) {
    console.error("getUserTags error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tags" });
  }
};

// Add this function to your existing fileController.js
exports.getUserFiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const files = await File.find({ owner: userId })
      .sort({ createdAt: -1 })
      .select(
        "uuid originalName size mimeType createdAt expiresAt tags downloadCount autoDelete public"
      );

    console.log(`✅ Found ${files.length} files for user ${userId}`);

    return res.status(200).json({
      success: true,
      files: files.map((file) => ({
        _id: file._id,
        uuid: file.uuid,
        originalName: file.originalName,
        fileName: file.originalName,
        size: file.size, // ← This should now work correctly
        mimeType: file.mimeType,
        uploadDate: file.createdAt,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
        tags: file.tags || [],
        downloadCount: file.downloadCount || 0,
        autoDelete: file.autoDelete || false,
        isPublic: file.public || false,
      })),
    });
  } catch (error) {
    console.error("❌ Get user files error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve files",
    });
  }
};

// Add these analytics controllers to your existing fileController.js

// 1. Download Trends Controller (For Line Charts)
// 1. FIXED: Download Trends Controller (For Line Charts)
exports.getDownloadTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user's file IDs
    const userFiles = await File.find({ owner: userId }, "_id");
    const fileIds = userFiles.map((file) => file._id);

    // ✅ FIXED: Use 'createdAt' instead of 'downloadTime'
    const downloadTrends = await AccessLog.aggregate([
      {
        $match: {
          file: { $in: fileIds },
          createdAt: { $gte: startDate }, // ← Changed from 'downloadTime'
          status: "success", // Only count successful downloads
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt", // ← Changed from 'downloadTime'
            },
          },
          downloads: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0 downloads
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const found = downloadTrends.find((trend) => trend._id === dateStr);
      result.push({
        date: dateStr,
        downloads: found ? found.downloads : 0,
      });
    }

    console.log(
      `✅ Generated download trends for ${days} days: ${result.length} data points`
    );

    res.status(200).json({
      success: true,
      trends: result,
    });
  } catch (error) {
    console.error("❌ Download trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get download trends",
    });
  }
};

// 2. File Type Distribution Controller (This one is fine)
exports.getFileTypeStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const fileTypeStats = await File.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      {
        $addFields: {
          fileType: {
            $toLower: {
              $arrayElemAt: [{ $split: ["$originalName", "."] }, -1],
            },
          },
        },
      },
      {
        $group: {
          _id: "$fileType",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log(`✅ Generated file type stats: ${fileTypeStats.length} types`);

    res.status(200).json({
      success: true,
      fileTypes: fileTypeStats,
    });
  } catch (error) {
    console.error("❌ File type stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get file type stats",
    });
  }
};

// 3. FIXED: Popular Files & Geographic Stats Controller
exports.getPopularFilesAndGeo = async (req, res) => {
  try {
    const userId = req.user.id;

    // Most downloaded files
    const popularFiles = await File.find({ owner: userId })
      .sort({ downloadCount: -1 })
      .limit(10)
      .select("originalName downloadCount size createdAt"); // ← Use createdAt instead of uploadDate

    // Geographic distribution using your AccessLog
    const userFiles = await File.find({ owner: userId }, "_id");
    const fileIds = userFiles.map((file) => file._id);

    const geoStats = await AccessLog.aggregate([
      {
        $match: {
          file: { $in: fileIds },
          location: { $exists: true, $ne: null, $ne: "" },
          status: "success", // Only count successful downloads
        },
      },
      {
        $group: {
          _id: "$location",
          downloads: { $sum: 1 },
        },
      },
      { $sort: { downloads: -1 } },
      { $limit: 10 },
    ]);

    console.log(
      `✅ Generated popular files: ${popularFiles.length}, geo stats: ${geoStats.length}`
    );

    res.status(200).json({
      success: true,
      popularFiles,
      geoStats,
    });
  } catch (error) {
    console.error("❌ Popular files and geo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular files and geo stats",
    });
  }
};

// Add this new function to controllers/fileController.js

exports.shareFileWithUser = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { targetEmail } = req.body; // The email of the user to share with
    const ownerId = req.user.id;

    if (!targetEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Target email is required." });
    }

    // Find the file and the target user concurrently for efficiency
    const [file, targetUser] = await Promise.all([
      File.findOne({ uuid }),
      User.findOne({ email: targetEmail }),
    ]);

    // --- Validation Checks ---
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found." });
    }
    if (file.owner.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You are not the owner of this file.",
      });
    }
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User to share with not found." });
    }
    if (targetUser._id.toString() === ownerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot share a file with yourself.",
      });
    }
    if (file.sharedWith.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: "File is already shared with this user.",
      });
    }

    // Add the target user's ID to the sharedWith array
    file.sharedWith.push(targetUser._id);
    await file.save();

    res.status(200).json({
      success: true,
      message: `File successfully shared with ${targetUser.name}.`,
    });
  } catch (error) {
    console.error("Share File Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sharing the file.",
    });
  }
};

// Add this new function to controllers/fileController.js

exports.getAvailableUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all users except the current user, excluding sensitive data
    const availableUsers = await User.find(
      {
        _id: { $ne: currentUserId }, // Exclude current user
        role: { $in: ["User", "Author"] }, // Only include User and Author roles
      },
      {
        name: 1,
        email: 1,
        role: 1,
        createdAt: 1,
      }
    ).sort({ name: 1, email: 1 }); // Sort by name, then email

    res.status(200).json({
      success: true,
      data: availableUsers,
    });
  } catch (error) {
    console.error("Get Available Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available users",
    });
  }
};

// Add this new function to controllers/fileController.js

exports.getSharedWithMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all files where the current user is in the sharedWith array
    const sharedFiles = await File.find({
      sharedWith: userId,
    })
      .populate("owner", "name email") // Get owner details
      .select("originalName size createdAt tags uuid owner downloadCount")
      .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      data: sharedFiles,
    });
  } catch (error) {
    console.error("Get Shared Files Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shared files",
    });
  }
};
