const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getMyAccessLogs,
  getAllAccessLogs,
} = require("../controllers/logController");

const isAdmin = require("../middlewares/isAdmin");

router.get("/my-downloads", authMiddleware, getMyAccessLogs);

router.get("/all-access", authMiddleware, isAdmin, getAllAccessLogs);

module.exports = router;
