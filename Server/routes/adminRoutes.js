const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/isAdmin");

router.get("/stats", authMiddleware, isAdmin, getAdminStats);

module.exports = router;
