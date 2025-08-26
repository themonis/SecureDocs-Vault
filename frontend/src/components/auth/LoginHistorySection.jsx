import React, { useState, useEffect } from "react";
import { authAPI } from "../../services/api";
import { format } from "date-fns";

const LoginHistorySection = () => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginStats, setLoginStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    fetchLoginData();
  }, []);

  const fetchLoginData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyResponse, statsResponse] = await Promise.all([
        authAPI.getMyLoginHistory(),
        authAPI.getLoginStats(),
      ]);

      console.log("🔍 [FRONTEND] History Response:", historyResponse);
      console.log("🔍 [FRONTEND] Stats Response:", statsResponse);

      if (historyResponse?.data) {
        const historyData =
          historyResponse.data.loginHistory ||
          historyResponse.data.data ||
          historyResponse.data;
        console.log("🔍 [FRONTEND] Extracted history data:", historyData);

        if (Array.isArray(historyData)) {
          historyData.forEach((record, index) => {
            console.log(`🔍 [FRONTEND] Record ${index} method:`, {
              method: record.method,
              type: typeof record.method,
              location: record.location,
              email: record.email,
              success: record.success,
            });
          });
        }

        setLoginHistory(Array.isArray(historyData) ? historyData : []);
      }

      if (statsResponse?.data) {
        const statsData =
          statsResponse.data.data ||
          statsResponse.data.stats ||
          statsResponse.data;
        console.log("🔍 [FRONTEND] Extracted stats data:", statsData);
        setLoginStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch login data:", error);
      setError("Failed to load login data. Please try again later.");
      setLoginHistory([]);
      setLoginStats(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (success) => {
    return success ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/20 text-green-300 border border-green-400/30">
        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
        Success
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/20 text-red-300 border border-red-400/30">
        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></div>
        Failed
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Unknown";
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  const getMethodBadge = (method) => {
    const cleanMethod = method?.trim?.() || "";

    console.log(`🔍 [FRONTEND] getMethodBadge called with:`, {
      originalMethod: method,
      cleanMethod: cleanMethod,
      type: typeof method,
    });

    switch (cleanMethod) {
      case "Google OAuth":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-400/20 text-blue-300 border border-blue-400/30">
            🚀 Google OAuth
          </span>
        );
      case "Email/Password":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-400/20 text-gray-300 border border-gray-400/30">
            ✉️ Email/Password
          </span>
        );
      case "":
      case null:
      case undefined:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
            ❓ Unknown Method
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-400/20 text-purple-300 border border-purple-400/30">
            🔐 {cleanMethod}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg overflow-hidden">
        <div className="animate-pulse p-6">
          <div className="h-6 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Unable to Load Login Data
          </h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={fetchLoginData}
            className="bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors border border-blue-400/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg overflow-hidden">
      {/* Enhanced Header with Glassmorphism Gradient */}
      <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-600/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">
            Login Security Dashboard
          </h3>
        </div>
      </div>

      {/* Tab Navigation with Glassmorphism */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === "history"
                ? "border-blue-400 text-blue-300 bg-white/10"
                : "border-transparent text-white/60 hover:text-white/80 hover:border-white/30"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Login History (
                {Array.isArray(loginHistory) ? loginHistory.length : 0})
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === "stats"
                ? "border-blue-400 text-blue-300 bg-white/10"
                : "border-transparent text-white/60 hover:text-white/80 hover:border-white/30"
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Statistics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "history" && (
          <div className="space-y-4">
            {!Array.isArray(loginHistory) || loginHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/40 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  No Login History Found
                </h4>
                <p className="text-white/60 mb-4">
                  Your login attempts will appear here once you log in
                </p>
                <button
                  onClick={fetchLoginData}
                  className="bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors border border-blue-400/30"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Date & Time</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Status</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>Location</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          <div className="flex items-center space-x-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            <span>Login Method</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
                      {loginHistory.map((login, index) => {
                        console.log(`🔍 [FRONTEND] Rendering login ${index}:`, {
                          method: login.method,
                          location: login.location,
                          success: login.success,
                          loginTime: login.loginTime,
                        });

                        return (
                          <tr
                            key={login._id || index}
                            className="hover:bg-white/5 transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-4 h-4 text-white/60"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6m0-6h4.01M8 13V7.01"
                                  />
                                </svg>
                                <span className="font-medium">
                                  {formatDate(login.loginTime)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(login.success)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                              <div className="flex items-center space-x-2">
                                <svg
                                  className="w-4 h-4 text-white/60"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                </svg>
                                <span>
                                  {login.location || "Unknown Location"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getMethodBadge(login.method)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div>
            {!loginStats ? (
              <div className="text-center py-12">
                <div className="text-white/40 mb-4">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="text-white/70 font-medium">
                  No statistics available
                </p>
                <p className="text-sm text-white/50 mt-1">
                  Statistics will appear here once you have login activity
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Successful Logins */}
                <div className="bg-gradient-to-br from-green-400/20 to-green-500/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-400/30 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-green-400/50">
                        <svg
                          className="w-6 h-6 text-green-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-300">
                        Successful Logins
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {loginStats.totalSuccessfulLogins || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Failed Attempts */}
                <div className="bg-gradient-to-br from-red-400/20 to-red-500/20 backdrop-blur-sm rounded-xl p-6 border border-red-400/30">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-400/30 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-red-400/50">
                        <svg
                          className="w-6 h-6 text-red-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-300">
                        Failed Attempts
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {loginStats.totalFailedAttempts || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unique Locations */}
                <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-400/30 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-blue-400/50">
                        <svg
                          className="w-6 h-6 text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-300">
                        Unique Locations
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {loginStats.uniqueLocations || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Login */}
                <div className="bg-gradient-to-br from-purple-400/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-400/30 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-purple-400/50">
                        <svg
                          className="w-6 h-6 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-300">
                        Last Login
                      </p>
                      <p className="text-sm font-bold text-white">
                        {loginStats.lastLogin
                          ? formatDate(loginStats.lastLogin.loginTime)
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHistorySection;
