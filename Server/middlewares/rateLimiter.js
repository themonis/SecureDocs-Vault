const rateLimit = require("express-rate-limit");

// Create a rate limiter specifically for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// You can export one or more limiters from this file
module.exports = {
  authLimiter,
};
