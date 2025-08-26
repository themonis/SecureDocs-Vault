import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration - but NOT signup/login validation errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on token expiration, not on signup/login validation errors
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization
    ) {
      // Only redirect if we were using an auth token (not during signup/login)
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API functions matching your exact backend
export const authAPI = {
  // Step 1: Send OTP for signup
  sendSignupOTP: (email) => api.post("/auth/send-otp", { email }),

  // Step 2: Complete signup with OTP
  signup: (username, email, password, confirmPassword, otp) =>
    api.post("/auth/signup", {
      username,
      email,
      password,
      confirmPassword,
      otp,
    }),

  // 2FA login flow
  loginRequest: (email, password) =>
    api.post("/auth/2fa/login/request", { email, password }),

  verifyOTP: (email, otp) =>
    api.post("/auth/2fa/login/verify", { email, otp }).then((res) => res.data),

  // Google OAuth
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
  // ✅ Add token verification
  verifyToken: () => api.get("/auth/verify-token"),

  requestRoleUpgrade: async (requestedRole) => {
    return await api.post("/role/request", { requestedRole });
  },

  // Password reset functions
  requestPasswordReset: (email) => api.post("/auth/forgot-password", { email }),

  resetPassword: (token, userId, newPassword, confirmPassword) =>
    api.post("/auth/reset-password", {
      token,
      userId,
      newPassword,
      confirmPassword,
    }),

  getMyLoginHistory: () => api.get("/login/my-login-history"),

  getRecentActivity: () => api.get("/login/recent-activity"),

  getLoginStats: () => api.get("/login/login-stats"),

  // ✅ NEW: Admin function - get all login history
  getAllLoginHistory: () => api.get("/login/all-login-history"),

  getAdminLoginStats: () => api.get("/login/admin-login-stats"),
};

// File API functions
// Add this to your existing fileAPI object in api.js
export const fileAPI = {
  // Get user's files
  getMyFiles: () => api.get("/files/my-files"),

  // Upload files
  upload: (formData) =>
    api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Download file
  download: (uuid) =>
    api.get(`/files/download/${uuid}`, { responseType: "blob" }),

  // Delete file
  delete: (uuid) => api.delete(`/files/delete/${uuid}`),

  // Generate public link
  generatePublicLink: (uuid, options) =>
    api.post(`/files/public-link/${uuid}`, options),
  //analytics functions:
  getDownloadTrends: (days = 7) =>
    api.get(`/files/analytics/trends?days=${days}`),
  getFileTypeStats: () => api.get("/files/analytics/file-types"),
  getPopularFilesAndGeo: () => api.get("/files/analytics/popular-geo"),

  // ... rest of your existing functions

  // Public file download (used by recipients)
  publicDownload: (token, password = null) => {
    const data = password ? { password } : {};
    return api.post(`/files/public/${token}`, data, { responseType: "blob" });
  },

  // Make sure these search functions exist:
  searchFilesByTags: (tags) => api.get("/files/search", { params: { tags } }),

  // Get user's tags
  getUserTags: () => api.get("/files/tags"),

  // Analytics API functions
  getAnalytics: () => api.get("/files/analytics"),

  getActivityLogs: (limit = 10) => api.get(`/files/activity?limit=${limit}`),

  getDownloadStats: () => api.get("/files/download-stats"),

  getPopularFiles: (limit = 5) => api.get(`/files/popular?limit=${limit}`),

  shareWithUser: async (uuid, targetEmail) => {
    return await api.post(`/files/share/${uuid}`, { targetEmail });
  },
  getSharedWithMe: async () => {
    return await api.get("/files/shared-with-me");
  },

  getAvailableUsers: async () => {
    return await api.get("/files/available-users");
  },

  downloadFile: async (fileUuid) => {
    return await api.get(`/files/download/${fileUuid}`, {
      responseType: "blob", // Important for file downloads
    });
  },
};

// Admin & Role API functions
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
};

// Activity & Logs API functions
export const activityAPI = {
  logActivity: (activityData) => api.post("/activity/log", activityData),

  getMyActivity: () => api.get("/activity/my-activity"),

  getAllActivity: () => api.get("/activity/all"),

  getMyDownloads: () => api.get("/logs/my-downloads"),

  getAllAccessLogs: () => api.get("/logs/all-access"),
  getMyAccessLogs: () => api.get("/logs/my-downloads"),
};

// ✅ UPDATED: Role API functions (replace existing ones)
export const roleAPI = {
  // Submit role request (for GuestLanding)
  submitRequest: (requestedRole, reason) =>
    api.post("/role/request", { requestedRole, reason }),

  // Get pending requests (for AdminDashboard)
  getPendingRequests: () => api.get("/role/pending"),

  // Handle role approval/rejection (for AdminDashboard)
  handleRequest: (requestId, action) =>
    api.post("/role/handle", { requestId, action }),
};

export default api;
