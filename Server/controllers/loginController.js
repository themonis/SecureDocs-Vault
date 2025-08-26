const geoip = require("geoip-lite");
const fetch = require("node-fetch");
const https = require("https"); // ✅ Built-in Node.js module - no installation needed
const LoginHistory = require("../models/LoginHistory");

// Rest of your existing code...

const locationCache = new Map();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// function for IP-based location detection
const getLocationFromIP = async (ipAddress) => {
  try {
    console.log("🔍 [DEBUG] Starting getLocationFromIP with:", ipAddress);

    let finalIP = ipAddress;

    if (
      !ipAddress ||
      ipAddress === "::1" ||
      ipAddress === "127.0.0.1" ||
      ipAddress?.includes("localhost") ||
      ipAddress?.startsWith("192.168.") ||
      ipAddress?.startsWith("10.") ||
      ipAddress?.startsWith("172.")
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

        finalIP = publicIP;
        console.log("🔍 [DEBUG] Successfully got public IP:", finalIP);
      } catch (error) {
        console.error("❌ [DEBUG] Public IP fetch failed:", error);
        return "Local Development (IP detection failed)";
      }
    }

    // ✅ CHECK CACHE FIRST
    const cacheKey = `loc_${finalIP}`;
    const cached = locationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(
        `📋 [CACHE HIT] Using cached location for ${finalIP}: ${cached.location}`
      );
      return cached.location;
    }

    console.log(
      `🔄 [CACHE MISS] No cache for ${finalIP}, fetching from API...`
    );

    // ✅ Try multiple location services
    const locationServices = [
      // Service 1: ipinfo.io (more reliable)
      {
        url: `https://ipinfo.io/${finalIP}/json`,
        parser: (data) => {
          if (data.city && data.region && data.country) {
            return `${data.city}, ${data.region}, ${data.country}`;
          }
          return null;
        },
      },
      // Service 2: ipapi.co (backup)
      {
        url: `https://ipapi.co/${finalIP}/json/`,
        parser: (data) => {
          if (data.city && data.region && data.country_name) {
            return `${data.city}, ${data.region}, ${data.country_name}`;
          }
          return null;
        },
      },
      // Service 3: ip-api.com with different approach
      {
        url: `http://ip-api.com/json/${finalIP}?fields=city,regionName,country,status`,
        parser: (data) => {
          if (
            data.status === "success" &&
            data.city &&
            data.regionName &&
            data.country
          ) {
            return `${data.city}, ${data.regionName}, ${data.country}`;
          }
          return null;
        },
      },
    ];

    // Try each service until one works
    for (let i = 0; i < locationServices.length; i++) {
      const service = locationServices[i];
      try {
        console.log(
          `🔍 [DEBUG] Trying location service ${i + 1}:`,
          service.url
        );

        const locationData = await new Promise((resolve, reject) => {
          const protocol = service.url.startsWith("https://")
            ? require("https")
            : require("http");
          const req = protocol.get(service.url, (res) => {
            console.log(
              `🔍 [DEBUG] Service ${i + 1} response status:`,
              res.statusCode
            );

            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }

            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                const parsed = JSON.parse(data);
                console.log(
                  `🔍 [DEBUG] Service ${i + 1} parsed response:`,
                  parsed
                );
                resolve(parsed);
              } catch (e) {
                reject(e);
              }
            });
          });
          req.on("error", reject);
          req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error("Timeout"));
          });
        });

        const location = service.parser(locationData);
        if (location) {
          console.log(
            `🔍 [DEBUG] Service ${i + 1} success! Location:`,
            location
          );

          // ✅ CACHE THE SUCCESSFUL RESULT
          locationCache.set(cacheKey, {
            location: location,
            timestamp: Date.now(),
            service: `Service ${i + 1}`, // Optional: track which service worked
          });

          console.log(
            `💾 [CACHE STORE] Cached location for ${finalIP}: ${location}`
          );

          return location;
        } else {
          console.log(`❌ [DEBUG] Service ${i + 1} couldn't parse location`);
        }
      } catch (error) {
        console.error(`❌ [DEBUG] Service ${i + 1} failed:`, error.message);
        continue; // Try next service
      }
    }

    // If all services fail, return a meaningful fallback
    console.log("❌ [DEBUG] All location services failed");
    return "Unknown Location";
  } catch (error) {
    console.error("❌ [DEBUG] Overall error in getLocationFromIP:", error);
    return "Unknown Location";
  }
};

// ✅ OPTIONAL: Cache cleanup function (call periodically to prevent memory leaks)
const cleanupLocationCache = () => {
  const now = Date.now();
  const keysToDelete = [];

  for (const [key, value] of locationCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => locationCache.delete(key));

  if (keysToDelete.length > 0) {
    console.log(
      `🧹 [CACHE CLEANUP] Removed ${keysToDelete.length} expired entries`
    );
  }
};

// Optional: Set up periodic cache cleanup (every 30 minutes)
setInterval(cleanupLocationCache, 30 * 60 * 1000);

// Log a login attempt (success or failure)
exports.logLoginAttempt = async (req, res, loginData) => {
  try {
    console.log("🔍 [DEBUG] logLoginAttempt called");
    console.log(
      "🔍 [DEBUG] loginData received:",
      JSON.stringify(loginData, null, 2)
    );

    let email, success, method, ipAddress, userAgent, userId;

    if (loginData) {
      email = loginData.email;
      success = loginData.success;
      method = loginData.method;
      ipAddress = loginData.ipAddress || req.ip;
      userAgent = loginData.userAgent || req.get("User-Agent");
      userId = loginData.userId;

      console.log("🔍 [DEBUG] After extraction - method value:", method);
      console.log("🔍 [DEBUG] Method type:", typeof method);
    } else {
      ({ email, success, method, ipAddress, userAgent } = req.body);
      method = method || "Email/Password";
    }

    console.log("🔍 [DEBUG] Before creating LoginHistory - method:", method);

    const loginHistoryData = {
      email: email,
      userId: userId || null,
      success: success,
      method: method,
      ipAddress: ipAddress,
      userAgent: userAgent,
      loginTime: new Date(),
      location: await getLocationFromIP(ipAddress),
    };

    console.log(
      "🔍 [DEBUG] LoginHistory data object:",
      JSON.stringify(loginHistoryData, null, 2)
    );

    const newLoginHistory = new LoginHistory(loginHistoryData);

    console.log(
      "🔍 [DEBUG] Created LoginHistory instance - method:",
      newLoginHistory.method
    );

    await newLoginHistory.save();

    console.log(
      "🔍 [DEBUG] Saved LoginHistory - final method:",
      newLoginHistory.method
    );
    console.log(
      `🔐 Login tracked: ${email} - ${
        success ? "SUCCESS" : "FAILED"
      } - Method: ${newLoginHistory.method} - Location: ${
        newLoginHistory.location
      }`
    );

    if (!loginData && res) {
      res.json({
        success: true,
        message: "Login attempt logged successfully",
      });
    }
  } catch (error) {
    console.error("❌ Error logging login attempt:", error);

    if (!loginData && res) {
      res.status(500).json({
        success: false,
        message: "Failed to log login attempt",
      });
    }
  }
};

// Get user's login history
exports.getMyLoginHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    const loginHistory = await LoginHistory.find({
      $or: [{ userId: userId }, { email: userEmail }],
    })
      .sort({ loginTime: -1 })
      .limit(20) // Last 20 login attempts
      .select("ipAddress location userAgent success loginTime method");

    res.json({
      success: true,
      loginHistory: loginHistory,
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch login history",
    });
  }
};

// Get all login history (Admin only)
exports.getAllLoginHistory = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const loginHistory = await LoginHistory.find({})
      .sort({ loginTime: -1 })
      .limit(100)
      .populate("userId", "email name role");

    res.json({
      success: true,
      loginHistory: loginHistory,
    });
  } catch (error) {
    console.error("Error fetching all login history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch login history",
    });
  }
};

// Add these new functions to your existing loginController.js

// Get recent activity (last 10 successful logins only)
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get only successful logins for recent activity
    const recentLogins = await LoginHistory.find({
      $or: [{ userId: userId }, { email: userEmail }],
      success: true, // Only successful logins
    })
      .sort({ loginTime: -1 })
      .limit(10)
      .select("loginTime location ipAddress userAgent");

    res.json({
      success: true,
      message: "Recent activity retrieved successfully",
      data: recentLogins,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
    });
  }
};

// Get login statistics
exports.getLoginStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Get various statistics
    const totalLogins = await LoginHistory.countDocuments({
      $or: [{ userId: userId }, { email: userEmail }],
      success: true,
    });

    const failedAttempts = await LoginHistory.countDocuments({
      $or: [{ userId: userId }, { email: userEmail }],
      success: false,
    });

    const lastLogin = await LoginHistory.findOne({
      $or: [{ userId: userId }, { email: userEmail }],
      success: true,
    })
      .sort({ loginTime: -1 })
      .select("loginTime location");

    // Get unique locations
    const uniqueLocations = await LoginHistory.distinct("location", {
      $or: [{ userId: userId }, { email: userEmail }],
      success: true,
    });

    res.json({
      success: true,
      message: "Login statistics retrieved successfully",
      data: {
        totalSuccessfulLogins: totalLogins,
        totalFailedAttempts: failedAttempts,
        lastLogin: lastLogin,
        uniqueLocations: uniqueLocations.length,
        locations: uniqueLocations.filter((loc) => loc !== "Unknown"),
      },
    });
  } catch (error) {
    console.error("Error fetching login statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch login statistics",
    });
  }
};

// Get system-wide login statistics (Admin only)
exports.getAdminLoginStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    // ✅ NEW: Date range for recent stats (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get system-wide statistics (all time)
    const totalSuccessfulLogins = await LoginHistory.countDocuments({
      success: true,
    });

    const totalFailedAttempts = await LoginHistory.countDocuments({
      success: false,
    });

    // ✅ NEW: Recent stats (last 30 days)
    const recentSuccessfulLogins = await LoginHistory.countDocuments({
      success: true,
      loginTime: { $gte: thirtyDaysAgo },
    });

    const recentFailedAttempts = await LoginHistory.countDocuments({
      success: false,
      loginTime: { $gte: thirtyDaysAgo },
    });

    const totalUniqueUsers = await LoginHistory.distinct("userId", {
      userId: { $ne: null },
    });

    // ✅ NEW: Recent unique users (last 30 days)
    const recentUniqueUsers = await LoginHistory.distinct("userId", {
      userId: { $ne: null },
      loginTime: { $gte: thirtyDaysAgo },
    });

    const uniqueLocations = await LoginHistory.distinct("location", {
      success: true,
    });

    // ✅ NEW: Recent unique locations (last 30 days)
    const recentUniqueLocations = await LoginHistory.distinct("location", {
      success: true,
      loginTime: { $gte: thirtyDaysAgo },
    });

    const recentActivity = await LoginHistory.find({ success: true })
      .sort({ loginTime: -1 })
      .limit(5)
      .populate("userId", "email name role")
      .select("loginTime location ipAddress userId");

    // ✅ NEW: Most active users (last 30 days)
    const mostActiveUsers = await LoginHistory.aggregate([
      {
        $match: {
          success: true,
          userId: { $ne: null },
          loginTime: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: "$userId", loginCount: { $sum: 1 } } },
      { $sort: { loginCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users", // Adjust this to your users collection name
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);

    res.json({
      success: true,
      message: "Admin login statistics retrieved successfully",
      data: {
        // All-time stats
        totalSuccessfulLogins,
        totalFailedAttempts,
        totalUniqueUsers: totalUniqueUsers.length,
        uniqueLocations: uniqueLocations.filter((loc) => loc !== "Unknown")
          .length,

        // ✅ NEW: Recent stats (last 30 days)
        recent: {
          successfulLogins: recentSuccessfulLogins,
          failedAttempts: recentFailedAttempts,
          uniqueUsers: recentUniqueUsers.length,
          uniqueLocations: recentUniqueLocations.filter(
            (loc) => loc !== "Unknown"
          ).length,
        },

        // Activity data
        recentActivity,
        mostActiveUsers,
        locations: uniqueLocations.filter((loc) => loc !== "Unknown"),
      },
    });
  } catch (error) {
    console.error("Error fetching admin login statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin login statistics",
    });
  }
};

// Add to loginController.js
exports.getFailedLoginAttempts = async (req, res) => {
  try {
    // Get last 20 failed login attempts
    const failedLogins = await LoginHistory.find({ success: false })
      .sort({ loginTime: -1 })
      .limit(20)
      .select('email ipAddress location loginTime userAgent');

    // Group by IP to count attempts per IP
    const ipAttempts = {};
    failedLogins.forEach(login => {
      const ip = login.ipAddress;
      if (!ipAttempts[ip]) {
        ipAttempts[ip] = {
          ip: ip,
          location: login.location || 'Unknown',
          attempts: 0,
          lastAttempt: login.loginTime,
          blocked: false // You can add blocking logic later
        };
      }
      ipAttempts[ip].attempts++;
      // Keep the most recent attempt time
      if (login.loginTime > ipAttempts[ip].lastAttempt) {
        ipAttempts[ip].lastAttempt = login.loginTime;
      }
    });

    // Convert to array and add unique IDs
    const formatted = Object.values(ipAttempts).map((item, index) => ({
      id: index + 1,
      ...item
    }));

    res.json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('Error fetching failed login attempts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failed login attempts'
    });
  }
};


// Add to loginController.js
exports.getSecurityAlerts = async (req, res) => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const failedLoginsCount = await LoginHistory.countDocuments({
    success: false,
    loginTime: { $gte: last24h },
  });

  const alerts = [];
  if (failedLoginsCount > 5) {
    alerts.push({
      type: "high",
      title: `${failedLoginsCount} failed login attempts`,
      description: "Multiple failed logins detected in last 24 hours",
    });
  }

  res.json(alerts);
};
