const express = require("express");
const router = express.Router();

const fileController = require("../controllers/fileController");
const auth = require("../middlewares/authMiddleware");
const upload = require("../middlewares/multerConfig");

const {
  // ... your existing imports
  getAvailableUsers,
} = require("../controllers/fileController");

const {
  generatePublicLink,
  publicDownload,
} = require("../controllers/fileController");

const { togglePublicLink } = require("../controllers/fileController");

const { deleteFile } = require("../controllers/fileController");

const { searchFilesByTags } = require("../controllers/fileController");

const { getSharedWithMe } = require("../controllers/fileController");

const { shareFileWithUser } = require("../controllers/fileController");

const { getUserTags } = require("../controllers/fileController");

// Route 1: Upload encrypted file
router.post(
  "/upload",
  auth,
  upload.single("file"),
  fileController.uploadEncryptedFile
);

// Route 2: Download decrypted file by UUID
router.get("/download/:uuid", auth, fileController.downloadDecryptedFile);

// Generate public link
router.post("/public-link/:uuid", auth, generatePublicLink);

// Public download
// Download via public token (POST so we can send password in body)
router.post("/public/:token", publicDownload);
router.get("/public/:token", publicDownload);

router.post("/toggle-link/:uuid", auth, togglePublicLink);

const authMiddleware = require("../middlewares/authMiddleware");

router.delete("/delete/:uuid", authMiddleware, deleteFile);

router.get("/search", auth, searchFilesByTags);

router.get("/tags", auth, getUserTags);

router.get("/my-files", auth, fileController.getUserFiles);

router.post("/share/:uuid", auth, shareFileWithUser);

// Make sure these routes exist in your fileRoutes.js
router.get("/analytics/trends", auth, fileController.getDownloadTrends);
router.get("/analytics/file-types", auth, fileController.getFileTypeStats);
router.get(
  "/analytics/popular-geo",
  auth,
  fileController.getPopularFilesAndGeo
);

// In routes/fileRoutes.js, add this new route:

router.get("/available-users", auth, fileController.getAvailableUsers);

router.get("/shared-with-me", auth, fileController.getSharedWithMe);

module.exports = router;
