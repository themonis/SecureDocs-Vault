/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { activityAPI } from "../services/api";
import LoginHistorySection from "../components/auth/LoginHistorySection";
import {
  User,
  Shield,
  Settings,
  Activity,
  Globe,
  Clock,
  Eye,
  Download,
  LogIn,
  Upload,
  Share2,
  Edit,
  X,
  ChevronRight,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../components/layout/Navbar";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myActivities, setMyActivities] = useState([]);
  const [myAccessLogs, setMyAccessLogs] = useState([]);

  useEffect(() => {
    loadProfileData();
  }, [user?.role]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      if (user?.role && user.role !== "Guest") {
        const promises = [];
        promises.push(activityAPI.getMyAccessLogs());
        if (user.role === "Author" || user.role === "Admin") {
          promises.push(activityAPI.getMyActivity());
        }

        const results = await Promise.all(promises);
        if (results[0]?.data?.downloads) {
          setMyAccessLogs(results[0].data.downloads.slice(0, 20));
        }
        if (results[1]?.data?.activities) {
          setMyActivities(results[1].data.activities.slice(0, 20));
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (item) => {
    if (!item) return "Unknown";

    // Try different possible timestamp fields safely
    const dateString =
      item.timestamp || item.createdAt || item.time || item.date;
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatMemberSince = (timestamp) => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown";
    }
  };

  const getUserDisplayName = (userObj) => {
    if (!userObj) return "User";
    if (userObj.email && !userObj.name && !userObj.username) {
      const emailName = userObj.email.split("@")[0];
      return (
        emailName
          .replace(/\d+/g, "")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .split(/[\s._-]+/)
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .filter((word) => word.length > 0)
          .join(" ") || "User"
      );
    }
    return userObj.name || userObj.username || userObj.displayName || "User";
  };

  const formatActivityDisplay = (activity) => {
    const action = activity.action?.toUpperCase() || "UNKNOWN";
    switch (action) {
      case "FILE_UPLOAD":
      case "UPLOAD":
        return {
          icon: <Upload className="w-4 h-4 text-green-400" />,
          title: "File Upload",
          description: `Uploaded ${activity.details?.fileName || "a file"}`,
          details: activity.details?.fileSize
            ? `Size: ${activity.details.fileSize}`
            : "",
        };
      case "FILE_SHARE":
      case "SHARE":
        return {
          icon: <Share2 className="w-4 h-4 text-blue-400" />,
          title: "File Shared",
          description: `Shared ${activity.details?.fileName || "a file"}`,
          details: activity.details?.recipientEmail
            ? `To: ${activity.details.recipientEmail}`
            : "",
        };
      case "FILE_DOWNLOAD":
      case "DOWNLOAD":
        return {
          icon: <Download className="w-4 h-4 text-purple-400" />,
          title: "File Downloaded",
          description: `Downloaded ${activity.details?.fileName || "a file"}`,
          details: activity.ipAddress ? `IP: ${activity.ipAddress}` : "",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-gray-400" />,
          title: "Activity",
          description: activity.action || "Unknown action",
          details: "",
        };
    }
  };

  const formatLogDisplay = (log) => {
    const isSuccess = log.status === "success" || log.success === true;
    const statusColors = isSuccess
      ? "bg-green-400/20 text-green-300 border-green-400/30"
      : "bg-red-400/20 text-red-300 border-red-400/30";

    return {
      title: log.action === "download" ? "File Access" : "System Access",
      description: log.fileName || log.action || "Unknown activity",
      location: log.location || "Unknown location",
      status: (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors}`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              isSuccess ? "bg-green-400" : "bg-red-400"
            }`}
          ></div>
          {isSuccess ? "Success" : "Failed"}
        </span>
      ),
    };
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      Guest: {
        color: "bg-gray-400/20 text-gray-300 border-gray-400/30",
        icon: "👤",
      },
      User: {
        color: "bg-blue-400/20 text-blue-300 border-blue-400/30",
        icon: "👨‍💼",
      },
      Author: {
        color: "bg-purple-400/20 text-purple-300 border-purple-400/30",
        icon: "✏️",
      },
      Admin: {
        color: "bg-red-400/20 text-red-300 border-red-400/30",
        icon: "👑",
      },
    };

    const config = roleConfig[role] || roleConfig.Guest;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
      >
        <span className="mr-1">{config.icon}</span>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-white/20 rounded-full"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-6 bg-white/20 rounded w-1/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  <div className="h-4 bg-white/20 rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-6"
                >
                  <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-4 bg-white/20 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navbar></Navbar>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Enhanced Profile Header */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-600/80 backdrop-blur-sm px-8 py-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {getUserDisplayName(user)}
                    </h1>
                    <div className="flex items-center space-x-4">
                      {getRoleBadge(user?.role)}
                      <div className="flex items-center text-white/70">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          Member since {formatMemberSince(user?.iat)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-white/30">
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-400/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-blue-400/50">
                    <User className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Display Name
                    </p>
                    <p className="text-lg font-semibold text-white">
                      {getUserDisplayName(user)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-400/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-green-400/50">
                    <Globe className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">Email</p>
                    <p className="text-lg font-semibold text-white">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-400/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-purple-400/50">
                    <Shield className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">User ID</p>
                    <p className="text-lg font-semibold text-white font-mono text-sm">
                      {user?.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login History Section */}
          <LoginHistorySection />

          {/* Guest Role Upgrade Section */}
          {user?.role === "Guest" && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-lg border border-yellow-400/30 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-400/30 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-yellow-400/50">
                  <TrendingUp className="w-6 h-6 text-yellow-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Unlock More Features
                  </h3>
                  <p className="text-white/70 mb-4">
                    Request access to files and advanced features!
                  </p>
                  <button className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 hover:from-yellow-600/80 hover:to-orange-600/80 backdrop-blur-sm text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg border border-yellow-400/30">
                    Request Role Upgrade
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Activity Sections */}
          {user?.role !== "Guest" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Recent Activity */}
              {(user?.role === "Author" || user?.role === "Admin") && (
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-6 h-6 text-white" />
                      <h3 className="text-lg font-semibold text-white">
                        Recent Activity
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 max-h-[420px] overflow-y-auto space-y-4">
                    {myActivities.length > 0 ? (
                      myActivities.map((activity, index) => {
                        const activityDisplay = formatActivityDisplay(activity);
                        return (
                          <div
                            key={index}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {activityDisplay.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-white">
                                    {activityDisplay.title}
                                  </p>
                                  <p className="text-xs text-white/60 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(activity)}
                                  </p>
                                </div>
                                <p className="text-sm text-white/70 mt-1">
                                  {activityDisplay.description}
                                </p>
                                {activityDisplay.details && (
                                  <p className="text-xs text-white/50 mt-2">
                                    {activityDisplay.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <Activity className="w-12 h-12 text-white/30 mx-auto mb-4" />
                        <p className="text-white/70 font-medium">
                          No recent activity
                        </p>
                        <p className="text-sm text-white/50 mt-1">
                          Your file uploads, shares, and other actions will
                          appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Access Logs */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500/80 to-teal-500/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-white" />
                    <h3 className="text-lg font-semibold text-white">
                      Security Logs
                    </h3>
                  </div>
                </div>

                <div className="p-6 max-h-[420px] overflow-y-auto space-y-4">
                  {myAccessLogs.length > 0 ? (
                    myAccessLogs.map((log, index) => {
                      const logDisplay = formatLogDisplay(log);
                      return (
                        <div
                          key={index}
                          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Eye className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-white">
                                    {logDisplay.title}
                                  </p>
                                  {logDisplay.status}
                                </div>
                                <p className="text-sm text-white/70 flex items-center">
                                  <Download className="w-3 h-3 mr-1" />
                                  📄 {logDisplay.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-white/50 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {logDisplay.location}
                                  </p>
                                  <p className="text-xs text-white/50 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(log)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70 font-medium">
                        No access logs yet
                      </p>
                      <p className="text-sm text-white/50 mt-1">
                        Your downloads and login activity will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Guest Message */}
          {user?.role === "Guest" && (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-blue-400/50">
                <User className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome, Guest User!
              </h3>
              <p className="text-white/70 max-w-md mx-auto">
                Guest accounts have limited access. Request a role upgrade to
                view your activity timeline and access logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
