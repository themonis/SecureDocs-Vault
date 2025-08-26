const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const mongoose = require("mongoose");
const cleanupExpiredFiles = require("./utils/cronCleanup");
require("dotenv").config();
const passport = require("passport");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // frontend origin
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ← This is crucial for HTML forms
app.use(cookieParser());

// Connect to MongoDB
connectDB();

// Initialize Passport
app.use(passport.initialize());

// Routes
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const logRoutes = require("./routes/logRoutes");
const adminRoutes = require("./routes/adminRoutes");
const activityRoutes = require("./routes/activityRoutes");
const roleRoutes = require("./routes/roleRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const loginRoutes = require("./routes/loginRoutes"); // or wherever you put the routes

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/login", loginRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("🚀 SecureDocs Vault API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});

cleanupExpiredFiles(); // Start the cron job
