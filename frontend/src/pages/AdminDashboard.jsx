/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { roleAPI } from "../services/api";
import { authAPI } from "../services/api";

import { fileAPI, activityAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/layout/Navbar";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Shield,
  Activity,
  Download,
  Globe,
  Eye,
  TrendingUp,
  MapPin,
  Monitor,
  Server,
  Wifi,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Existing Admin Data States
  const [allActivities, setAllActivities] = useState([]);
  const [allAccessLogs, setAllAccessLogs] = useState([]);
  const [systemStats, setSystemStats] = useState({});

  // Add these after your existing state variables
  const [allLoginHistory, setAllLoginHistory] = useState([]);
  const [adminLoginStats, setAdminLoginStats] = useState(null);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [securityAlerts, setSecurityAlerts] = useState([]);

  // ✅ ENHANCED: Additional Security Data States
  const [systemMetrics, setSystemMetrics] = useState({});
  const [networkStats, setNetworkStats] = useState({});
  const [threatDetection, setThreatDetection] = useState([]);
  const [accessPatterns, setAccessPatterns] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);

  // Role Requests States
  const [pendingRequests, setPendingRequests] = useState([]);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (user?.role === "Admin") {
      loadAdminData();
      loadPendingRequests();
      loadSecurityData(); // ✅ Load comprehensive security data
      loadLoginHistoryData();
    }
  }, [user]);

  useEffect(() => {
    if (allActivities.length > 0) {
      console.log("=== ACTIVITIES DEBUG ===");
      console.log("Total Activities:", allActivities.length);
      console.log("First 3 Activities:", allActivities.slice(0, 3));
      console.log("All Unique Actions:", [
        ...new Set(allActivities.map((a) => a.action)),
      ]);

      // Check for error-related activities
      const errorActivities = allActivities.filter(
        (a) =>
          a.action?.includes("limit") ||
          a.action?.includes("expired") ||
          a.action?.includes("unauthorized") ||
          a.action?.includes("error") ||
          a.action?.includes("fail")
      );
      console.log("Error Activities Found:", errorActivities);
    }

    if (allAccessLogs.length > 0) {
      console.log("=== ACCESS LOGS DEBUG ===");
      console.log("Total Access Logs:", allAccessLogs.length);
      console.log("First 3 Access Logs:", allAccessLogs.slice(0, 3));
      console.log("Success Values:", [
        ...new Set(allAccessLogs.map((l) => l.success)),
      ]);
      console.log("All Locations:", [
        ...new Set(allAccessLogs.map((l) => l.location)),
      ]);

      // Check for failed logs
      const failedLogs = allAccessLogs.filter((l) => l.success === false);
      console.log("Failed Access Logs:", failedLogs);
    }
  }, [allActivities, allAccessLogs]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [activitiesRes, logsRes] = await Promise.all([
        activityAPI.getAllActivity(),
        activityAPI.getAllAccessLogs(),
      ]);

      const activities = activitiesRes.data.activities || [];
      const logs = logsRes.data.logs || [];

      setAllActivities(activities);
      setAllAccessLogs(logs);

      // Calculate system-wide statistics
      const stats = calculateSystemStats(activities, logs);
      setSystemStats(stats);

      // Extract security alerts
      const alerts = detectSecurityAlerts(activities, logs);
      setSecurityAlerts(alerts);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Load Comprehensive Security Data
  const loadSecurityData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Mock comprehensive security data
      setSystemMetrics({
        cpuUsage: 45,
        memoryUsage: 67,
        diskUsage: 34,
        networkLatency: 12,
        activeConnections: 234,
        uptime: "15 days, 7 hours",
      });

      setNetworkStats({
        totalRequests: 15847,
        blockedRequests: 23,
        allowedCountries: 45,
        blockedCountries: 8,
        bandwidthUsed: "2.3 GB",
        peakTraffic: "15:30 UTC",
      });

      setThreatDetection([
        {
          id: 1,
          type: "Brute Force",
          severity: "high",
          source: "192.168.1.100",
          attempts: 15,
          blocked: true,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: 2,
          type: "SQL Injection",
          severity: "medium",
          source: "10.0.0.45",
          attempts: 3,
          blocked: true,
          timestamp: new Date(Date.now() - 7200000),
        },
        {
          id: 3,
          type: "DDoS Attempt",
          severity: "high",
          source: "Multiple IPs",
          attempts: 1200,
          blocked: true,
          timestamp: new Date(Date.now() - 10800000),
        },
      ]);

      setAccessPatterns([
        {
          country: "United States",
          requests: 8934,
          blocked: 12,
          flagColor: "🇺🇸",
        },
        {
          country: "United Kingdom",
          requests: 3421,
          blocked: 5,
          flagColor: "🇬🇧",
        },
        {
          country: "Germany",
          requests: 2156,
          blocked: 8,
          flagColor: "🇩🇪",
        },
        {
          country: "France",
          requests: 1876,
          blocked: 3,
          flagColor: "🇫🇷",
        },
      ]);

      setFailedLogins([
        {
          id: 1,
          ip: "192.168.1.50",
          attempts: 8,
          lastAttempt: new Date(Date.now() - 1800000),
          blocked: true,
          location: "New York, US",
        },
        {
          id: 2,
          ip: "10.0.0.23",
          attempts: 12,
          lastAttempt: new Date(Date.now() - 3600000),
          blocked: true,
          location: "London, UK",
        },
        {
          id: 3,
          ip: "172.16.0.45",
          attempts: 5,
          lastAttempt: new Date(Date.now() - 5400000),
          blocked: false,
          location: "Paris, FR",
        },
      ]);
    } catch (error) {
      console.error("Failed to load security data:", error);
    }
  };

  // ✅ UPDATED: loadPendingRequests function
  // ✅ FIXED: Update loadPendingRequests function
  const loadPendingRequests = async () => {
    try {
      const response = await roleAPI.getPendingRequests();

      console.log("Pending requests response:", response.data);

      if (response.data.success) {
        setPendingRequests(response.data.requests || []);
      } else {
        throw new Error(response.data.message || "Failed to load requests");
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      toast.error("Failed to load role requests");
      setPendingRequests([]);
    }
  };

  // ✅ UPDATED: handleApproval function
  // ✅ FIXED: Update handleApproval function
  const handleApproval = async (requestId, userId, action, requestedRole) => {
    try {
      setProcessing((prev) => ({ ...prev, [requestId]: true }));

      const response = await roleAPI.handleRequest(
        requestId,
        action === "approve" ? "approve" : "reject"
      );

      if (response.data.success) {
        if (action === "approve") {
          toast.success(
            `Role request approved! User upgraded to ${requestedRole}.`
          );
        } else {
          toast.success("Role request denied.");
        }
        loadPendingRequests(); // Refresh the list
      } else {
        throw new Error(response.data.message || "Failed to process request");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(
        error.response?.data?.message || `Failed to ${action} role request`
      );
    } finally {
      setProcessing((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const calculateSystemStats = (activities, logs) => {
    const totalUsers = [...new Set(activities.map((a) => a.user))].length;
    const totalDownloads = logs.length;
    const failedAttempts = activities.filter(
      (a) => a.action === "unauthorized"
    ).length;
    const uniqueIPs = [...new Set(logs.map((l) => l.ipAddress))].length;

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = activities.filter(
      (a) => new Date(a.createdAt) > last24Hours
    ).length;
    const recentDownloads = logs.filter(
      (l) => new Date(l.createdAt) > last24Hours
    ).length;

    const activityTypes = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {});

    const geoDistribution = logs.reduce((acc, log) => {
      const location = log.location || "Unknown";
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers,
      totalDownloads,
      failedAttempts,
      uniqueIPs,
      recentActivity,
      recentDownloads,
      activityTypes,
      geoDistribution,
      successRate:
        totalDownloads > 0
          ? (
              ((totalDownloads - failedAttempts) / totalDownloads) *
              100
            ).toFixed(1)
          : 0,
    };
  };

  const detectSecurityAlerts = (activities, logs) => {
    const alerts = [];
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unauthorizedAttempts = activities.filter(
      (a) => a.action === "unauthorized" && new Date(a.createdAt) > last24Hours
    );

    if (unauthorizedAttempts.length > 5) {
      alerts.push({
        type: "high",
        title: "High Unauthorized Access Attempts",
        description: `${unauthorizedAttempts.length} unauthorized attempts in last 24 hours`,
        timestamp: new Date(),
      });
    }

    const recentLogs = logs.filter((l) => new Date(l.createdAt) > last24Hours);
    const ipFrequency = recentLogs.reduce((acc, log) => {
      acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
      return acc;
    }, {});

    Object.entries(ipFrequency).forEach(([ip, count]) => {
      if (count > 50) {
        alerts.push({
          type: "medium",
          title: "Suspicious Download Activity",
          description: `IP ${ip} has ${count} downloads in 24 hours`,
          timestamp: new Date(),
        });
      }
    });

    return alerts;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Unknown Time";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown Time";
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Author":
        return "text-blue-400 bg-blue-500/20";
      case "User":
        return "text-green-400 bg-green-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  // ✅ NEW: Get severity color for threats
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "low":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  // ✅ NEW: Load Login History Data
  const loadLoginHistoryData = async () => {
    try {
      setLoginHistoryLoading(true);

      const [historyResponse, statsResponse] = await Promise.all([
        authAPI.getAllLoginHistory(),
        authAPI.getAdminLoginStats(),
      ]);

      if (historyResponse?.data?.success) {
        setAllLoginHistory(historyResponse.data.loginHistory || []);
      }

      if (statsResponse?.data?.success) {
        setAdminLoginStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching admin login data:", error);
      toast.error("Failed to load login history data");
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  // Chart configurations
  const activityChartData = {
    labels: Object.keys(systemStats.activityTypes || {}),
    datasets: [
      {
        label: "Activity Count",
        data: Object.values(systemStats.activityTypes || {}),
        backgroundColor: [
          "rgba(99, 102, 241, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
        ],
        borderColor: [
          "rgba(99, 102, 241, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(34, 197, 94, 1)",
          "rgba(251, 191, 36, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const geoChartData = {
    labels: Object.keys(systemStats.geoDistribution || {}),
    datasets: [
      {
        label: "Access by Location",
        data: Object.values(systemStats.geoDistribution || {}),
        backgroundColor: "rgba(99, 102, 241, 0.6)",
        borderColor: "rgba(99, 102, 241, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  // Check if user is admin
  if (user?.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-white/70">
              This area is restricted to administrators only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-white/70 text-lg">
            System-wide monitoring and management for SecureDocs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-purple-600 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "analytics"
                  ? "bg-purple-600 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-purple-600 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              🛡️ Security
            </button>
            <button
              onClick={() => setActiveTab("roleRequests")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors relative ${
                activeTab === "roleRequests"
                  ? "bg-purple-600 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              👥 Role Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 px-2 py-1 bg-yellow-500 text-yellow-900 rounded-full text-xs font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("loginHistory")}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "loginHistory"
                  ? "bg-purple-600 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              🔐 Login History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-blue-400" />
                      <p className="text-white/60 text-sm">Total Users</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {systemStats.totalUsers || 0}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Activity className="h-3 w-3 text-blue-400" />
                      <p className="text-white/50 text-xs">
                        {systemStats.recentActivity || 0} active today
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Download className="h-5 w-5 text-green-400" />
                      <p className="text-white/60 text-sm">Total Downloads</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {systemStats.totalDownloads || 0}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <p className="text-white/50 text-xs">
                        {systemStats.recentDownloads || 0} in last 24h
                      </p>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Download className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="text-white/60 text-sm">Failed Attempts</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {systemStats.failedAttempts || 0}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Eye className="h-3 w-3 text-red-400" />
                      <p className="text-white/50 text-xs">Failed attempts</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <UserCheck className="h-5 w-5 text-yellow-400" />
                      <p className="text-white/60 text-sm">Pending Requests</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {pendingRequests.length}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="h-3 w-3 text-yellow-400" />
                      <p className="text-white/50 text-xs">Role requests</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity and Access Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent System Activity */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent System Activity
                  </h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allActivities.slice(0, 10).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 py-3 px-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm font-medium">
                          {activity.action.toUpperCase()} User activity
                        </p>
                        <p className="text-white/60 text-xs">
                          {activity.details || "System activity"} • IP:{" "}
                          {activity.ipAddress || "Unknown"}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-white/50 text-xs">
                          {formatTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Access Logs */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent Access Logs
                  </h3>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allAccessLogs.slice(0, 10).map((log, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 py-3 px-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Download className="h-4 w-4 text-green-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/90 text-sm font-medium">
                          {log.fileName || "File access"}
                        </p>
                        <p className="text-white/60 text-xs">
                          {log.ipAddress} • {log.location || "Unknown location"}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-white/50 text-xs">
                          {formatTime(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analytics tab remains unchanged */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Enhanced Stats Overview - FIXED */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Successful Downloads
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {
                        allActivities.filter(
                          (activity) =>
                            activity.action === "Download success" ||
                            activity.action === "download"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-500/30 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Failed Attempts
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {
                        allActivities.filter(
                          (activity) => activity.action === "Download fail"
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Real Locations
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {
                        Object.keys(
                          allAccessLogs
                            .filter(
                              (log) =>
                                log.location &&
                                !log.location.includes("limit") &&
                                !log.location.includes("expired") &&
                                log.location !== "N/A" &&
                                log.location !== "Unknown"
                            )
                            .reduce((acc, log) => {
                              acc[log.location] = true;
                              return acc;
                            }, {})
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {(() => {
                        const successCount = allActivities.filter(
                          (a) =>
                            a.action === "Download success" ||
                            a.action === "download"
                        ).length;
                        const failCount = allActivities.filter(
                          (a) => a.action === "Download fail"
                        ).length;
                        const total = successCount + failCount;
                        return total > 0
                          ? Math.round((successCount / total) * 100)
                          : 0;
                      })()}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Filter Bar */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-white/60" />
                    <span className="text-white/80 text-sm">
                      Showing data for:
                    </span>
                    <span className="text-white font-medium">All time</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm border border-green-500/30">
                    Success Focus
                  </button>
                  <button className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm border border-red-500/30">
                    Error Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Charts Grid - FIXED DATA SOURCES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* FIXED: Real Geographic Locations Only */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-green-600/80 via-emerald-600/80 to-teal-600/80 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      Downloads by Real Location
                    </h3>
                  </div>
                </div>

                <div className="p-8">
                  <div
                    style={{
                      position: "relative",
                      height: "400px",
                      width: "100%",
                    }}
                  >
                    <Bar
                      data={{
                        labels: Object.keys(
                          allAccessLogs
                            .filter(
                              (log) =>
                                log.location &&
                                !log.location.includes("limit") &&
                                !log.location.includes("expired") &&
                                !log.location.includes("reached") &&
                                log.location !== "N/A" &&
                                log.location !== "Unknown"
                            )
                            .reduce((acc, log) => {
                              const location = log.location;
                              acc[location] = (acc[location] || 0) + 1;
                              return acc;
                            }, {})
                        ),
                        datasets: [
                          {
                            label: "Downloads by Location",
                            data: Object.values(
                              allAccessLogs
                                .filter(
                                  (log) =>
                                    log.location &&
                                    !log.location.includes("limit") &&
                                    !log.location.includes("expired") &&
                                    !log.location.includes("reached") &&
                                    log.location !== "N/A" &&
                                    log.location !== "Unknown"
                                )
                                .reduce((acc, log) => {
                                  const location = log.location;
                                  acc[location] = (acc[location] || 0) + 1;
                                  return acc;
                                }, {})
                            ),
                            backgroundColor: "rgba(34, 197, 94, 0.6)",
                            borderColor: "rgba(34, 197, 94, 1)",
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        ...chartOptions,
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleColor: "white",
                            bodyColor: "white",
                            borderColor: "rgba(34, 197, 94, 0.3)",
                            borderWidth: 1,
                            cornerRadius: 8,
                          },
                        },
                        scales: {
                          y: {
                            ...chartOptions.scales.y,
                            beginAtZero: true,
                            grid: {
                              color: "rgba(255, 255, 255, 0.1)",
                              drawBorder: false,
                            },
                            ticks: {
                              color: "rgba(255, 255, 255, 0.6)",
                              font: { size: 11 },
                            },
                          },
                          x: {
                            ...chartOptions.scales.x,
                            grid: { display: false },
                            ticks: {
                              color: "rgba(255, 255, 255, 0.6)",
                              font: { size: 11 },
                              maxRotation: 45,
                              minRotation: 0,
                            },
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Real Location Stats */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(
                      allAccessLogs
                        .filter(
                          (log) =>
                            log.location &&
                            !log.location.includes("limit") &&
                            !log.location.includes("expired") &&
                            !log.location.includes("reached") &&
                            log.location !== "N/A" &&
                            log.location !== "Unknown"
                        )
                        .reduce((acc, log) => {
                          const location = log.location;
                          acc[location] = (acc[location] || 0) + 1;
                          return acc;
                        }, {})
                    )
                      .slice(0, 6)
                      .map(([location, count]) => (
                        <div
                          key={location}
                          className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20"
                        >
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-green-400" />
                            <span className="text-white/90 text-sm truncate">
                              {location}
                            </span>
                          </div>
                          <span className="text-green-300 font-semibold text-sm">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* FIXED: Error Analysis Chart */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-600/80 via-rose-600/80 to-pink-600/80 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-6 h-6 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      Download Error Analysis
                    </h3>
                  </div>
                </div>

                <div className="p-8">
                  <div
                    style={{
                      position: "relative",
                      height: "400px",
                      width: "100%",
                    }}
                  >
                    <Doughnut
                      data={{
                        labels: Object.keys(
                          allAccessLogs
                            .filter(
                              (log) =>
                                log.location &&
                                (log.location.includes("limit") ||
                                  log.location.includes("expired") ||
                                  log.location.includes("reached"))
                            )
                            .reduce((acc, log) => {
                              const errorType =
                                log.location.includes("limit") ||
                                log.location.includes("reached")
                                  ? "Download Limit Exceeded"
                                  : "File Expired";
                              acc[errorType] = (acc[errorType] || 0) + 1;
                              return acc;
                            }, {})
                        ),
                        datasets: [
                          {
                            data: Object.values(
                              allAccessLogs
                                .filter(
                                  (log) =>
                                    log.location &&
                                    (log.location.includes("limit") ||
                                      log.location.includes("expired") ||
                                      log.location.includes("reached"))
                                )
                                .reduce((acc, log) => {
                                  const errorType =
                                    log.location.includes("limit") ||
                                    log.location.includes("reached")
                                      ? "Download Limit Exceeded"
                                      : "File Expired";
                                  acc[errorType] = (acc[errorType] || 0) + 1;
                                  return acc;
                                }, {})
                            ),
                            backgroundColor: [
                              "rgba(239, 68, 68, 0.8)",
                              "rgba(245, 101, 101, 0.8)",
                            ],
                            borderColor: [
                              "rgba(239, 68, 68, 1)",
                              "rgba(245, 101, 101, 1)",
                            ],
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        ...chartOptions,
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: "60%",
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            position: "bottom",
                            labels: {
                              color: "rgba(255, 255, 255, 0.8)",
                              padding: 20,
                              usePointStyle: true,
                              font: { size: 12, weight: "500" },
                            },
                          },
                          tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleColor: "white",
                            bodyColor: "white",
                            borderColor: "rgba(239, 68, 68, 0.3)",
                            borderWidth: 1,
                            cornerRadius: 8,
                          },
                        },
                      }}
                    />
                  </div>

                  {/* Center Error Count */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="text-center"
                      style={{ marginTop: "-100px" }}
                    >
                      <p className="text-2xl font-bold text-white">
                        {
                          allActivities.filter(
                            (activity) => activity.action === "Download fail"
                          ).length
                        }
                      </p>
                      <p className="text-white/60 text-sm">Failed Downloads</p>
                    </div>
                  </div>

                  {/* Error Stats */}
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-white/90 font-medium text-sm">
                          Download Failures
                        </span>
                      </div>
                      <span className="text-red-300 font-bold text-sm">
                        {
                          allActivities.filter(
                            (activity) => activity.action === "Download fail"
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="text-white/90 font-medium text-sm">
                          Limit/Expired Issues
                        </span>
                      </div>
                      <span className="text-red-300 font-bold text-sm">
                        {
                          allAccessLogs.filter(
                            (log) =>
                              log.location &&
                              (log.location.includes("limit") ||
                                log.location.includes("expired") ||
                                log.location.includes("reached"))
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of your analytics content... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-5 h-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">
                    Success Metrics
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Successful Downloads</span>
                    <span className="text-green-400 font-bold">
                      {
                        allActivities.filter(
                          (a) =>
                            a.action === "Download success" ||
                            a.action === "download"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Real Locations</span>
                    <span className="text-green-400 font-bold">
                      {
                        Object.keys(
                          allAccessLogs
                            .filter(
                              (log) =>
                                log.location &&
                                !log.location.includes("limit") &&
                                !log.location.includes("expired") &&
                                log.location !== "N/A" &&
                                log.location !== "Unknown"
                            )
                            .reduce((acc, log) => {
                              acc[log.location] = true;
                              return acc;
                            }, {})
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h4 className="text-lg font-semibold text-white">
                    Error Analysis
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Download Failures</span>
                    <span className="text-red-400 font-bold">
                      {
                        allActivities.filter(
                          (activity) => activity.action === "Download fail"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Limit/Expired Issues</span>
                    <span className="text-red-400 font-bold">
                      {
                        allAccessLogs.filter(
                          (log) =>
                            log.location &&
                            (log.location.includes("limit") ||
                              log.location.includes("expired"))
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">
                    System Health
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Total Activities</span>
                    <span className="text-blue-400 font-bold">
                      {allActivities.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Success Rate</span>
                    <span className="text-blue-400 font-bold">
                      {(() => {
                        const successCount = allActivities.filter(
                          (a) =>
                            a.action === "Download success" ||
                            a.action === "download"
                        ).length;
                        const failCount = allActivities.filter(
                          (a) => a.action === "Download fail"
                        ).length;
                        const total = successCount + failCount;
                        return total > 0
                          ? Math.round((successCount / total) * 100)
                          : 0;
                      })()}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ ENHANCED: Comprehensive Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-8">
            {/* Security Alerts */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">
                  Security Alerts
                </h3>
                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                  {securityAlerts.length} active
                </span>
              </div>
              {securityAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-white/70">
                    No security alerts at this time.
                  </p>
                  <p className="text-white/50 text-sm">
                    All systems are secure and operating normally.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        alert.type === "high"
                          ? "bg-red-500/20 border-red-500/50 text-red-300"
                          : alert.type === "medium"
                          ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                          : "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm mt-1">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-6">
                  <Monitor className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    System Metrics
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-blue-400" />
                      <span className="text-white/80">CPU Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-white/20 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">
                        {systemMetrics.cpuUsage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MemoryStick className="h-4 w-4 text-purple-400" />
                      <span className="text-white/80">Memory Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-white/20 rounded-full h-2">
                        <div
                          className="bg-purple-400 h-2 rounded-full"
                          style={{ width: `${systemMetrics.memoryUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">
                        {systemMetrics.memoryUsage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-green-400" />
                      <span className="text-white/80">Disk Usage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-white/20 rounded-full h-2">
                        <div
                          className="bg-green-400 h-2 rounded-full"
                          style={{ width: `${systemMetrics.diskUsage}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm">
                        {systemMetrics.diskUsage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-yellow-400" />
                      <span className="text-white/80">Network Latency</span>
                    </div>
                    <span className="text-white text-sm">
                      {systemMetrics.networkLatency}ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-red-400" />
                      <span className="text-white/80">Active Connections</span>
                    </div>
                    <span className="text-white text-sm">
                      {systemMetrics.activeConnections}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-white/80">System Uptime</span>
                    </div>
                    <span className="text-white text-sm">
                      {systemMetrics.uptime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Statistics */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-6">
                  <Globe className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Network Statistics
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-blue-400" />
                      <span className="text-white/80">Total Requests</span>
                    </div>
                    <span className="text-white text-sm font-bold">
                      {networkStats.totalRequests?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-red-400" />
                      <span className="text-white/80">Blocked Requests</span>
                    </div>
                    <span className="text-red-400 text-sm font-bold">
                      {networkStats.blockedRequests}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-white/80">Allowed Countries</span>
                    </div>
                    <span className="text-green-400 text-sm font-bold">
                      {networkStats.allowedCountries}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-white/80">Blocked Countries</span>
                    </div>
                    <span className="text-red-400 text-sm font-bold">
                      {networkStats.blockedCountries}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-purple-400" />
                      <span className="text-white/80">Bandwidth Used</span>
                    </div>
                    <span className="text-white text-sm">
                      {networkStats.bandwidthUsed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <span className="text-white/80">Peak Traffic</span>
                    </div>
                    <span className="text-white text-sm">
                      {networkStats.peakTraffic}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat Detection */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">
                  Threat Detection
                </h3>
              </div>
              <div className="space-y-3">
                {threatDetection.map((threat) => (
                  <div
                    key={threat.id}
                    className={`p-4 rounded-lg border transition-colors hover:bg-white/5 ${getSeverityColor(
                      threat.severity
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {threat.blocked ? (
                            <Lock className="h-5 w-5 text-green-400" />
                          ) : (
                            <Unlock className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {threat.type}
                          </h4>
                          <p className="text-sm text-white/70">
                            Source: {threat.source}
                          </p>
                          <p className="text-xs text-white/60">
                            {threat.attempts} attempts •{" "}
                            {formatTime(threat.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            threat.severity === "high"
                              ? "bg-red-500/20 text-red-300"
                              : threat.severity === "medium"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {threat.severity.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            threat.blocked
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {threat.blocked ? "BLOCKED" : "ACTIVE"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Access Patterns & Failed Logins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Access Patterns by Country */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Access Patterns
                  </h3>
                </div>
                <div className="space-y-3">
                  {accessPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{pattern.flagColor}</span>
                        <div>
                          <p className="text-white font-medium">
                            {pattern.country}
                          </p>
                          <p className="text-white/60 text-sm">
                            {pattern.requests.toLocaleString()} requests
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm">
                          Blocked: {pattern.blocked}
                        </p>
                        <div className="w-16 bg-white/20 rounded-full h-1 mt-1">
                          <div
                            className="bg-blue-400 h-1 rounded-full"
                            style={{
                              width: `${
                                (pattern.requests /
                                  Math.max(
                                    ...accessPatterns.map((p) => p.requests)
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Failed Login Attempts */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-6">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Failed Login Attempts
                  </h3>
                </div>
                <div className="space-y-3">
                  {failedLogins.map((login) => (
                    <div
                      key={login.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {login.blocked ? (
                              <Lock className="h-4 w-4 text-red-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{login.ip}</p>
                            <p className="text-white/60 text-sm">
                              {login.location}
                            </p>
                            <p className="text-white/50 text-xs">
                              Last: {formatTime(login.lastAttempt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-bold">
                            {login.attempts}
                          </p>
                          <p className="text-white/60 text-xs">attempts</p>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              login.blocked
                                ? "bg-red-500/20 text-red-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {login.blocked ? "BLOCKED" : "WATCHING"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Requests Tab - Keep existing */}
        {activeTab === "roleRequests" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-2 mb-6">
              <UserCheck className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-semibold text-white">
                Role Requests
              </h2>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium">
                {pendingRequests.length} pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/70 text-lg mb-2">
                  No pending role requests
                </p>
                <p className="text-white/50 text-sm">
                  All role requests have been processed. New requests will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            {/* ✅ FIXED: Added null checking */}
                            <h3 className="text-white font-semibold">
                              {request.user?.name ||
                                request.name ||
                                "Unknown User"}
                            </h3>
                            <div className="flex items-center space-x-2 text-white/60 text-sm">
                              <Mail className="h-3 w-3" />
                              {/* ✅ FIXED: Added null checking */}
                              <span>
                                {request.user?.email ||
                                  request.email ||
                                  "No email provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-white/60 text-sm">
                              Current Role
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                              <Shield className="h-3 w-3 mr-1" />
                              {/* ✅ FIXED: Added null checking */}
                              {request.user?.role || "Unknown"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm">
                              Requested Role
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                request.requestedRole
                              )}`}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {request.requestedRole || "Unknown"}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-white/60" />
                            <p className="text-white/60 text-sm">
                              Reason for Request
                            </p>
                          </div>
                          <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3 border border-white/10">
                            {request.reason || "No reason provided"}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 text-white/50 text-xs">
                          <Calendar className="h-3 w-3" />
                          <span>Requested {formatDate(request.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-6">
                        <button
                          onClick={() =>
                            handleApproval(
                              request._id,
                              request.user?._id || request.userId, // ✅ FIXED: Added fallback
                              "approve",
                              request.requestedRole
                            )
                          }
                          disabled={processing[request._id]}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:border-green-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <CheckCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() =>
                            handleApproval(
                              request._id,
                              request.user?._id || request.userId, // ✅ FIXED: Added fallback
                              "deny",
                              request.requestedRole
                            )
                          }
                          disabled={processing[request._id]}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-500/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                          <XCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>

                    {processing[request._id] && (
                      <div className="mt-4 flex items-center space-x-2 text-white/60">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                        <span className="text-sm">Processing request...</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ✅ NEW: Login History Tab */}
        {activeTab === "loginHistory" && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            {adminLoginStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Successful Logins */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-400/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-300" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-white/70">
                        All-Time Successful
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {adminLoginStats.totalSuccessfulLogins?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Successful Logins */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-400/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-300" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-white/70">
                        Recent (30 days)
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {adminLoginStats.recent?.successfulLogins?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Failed Attempts */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-400/30 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-300" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-white/70">
                        Failed Attempts
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {adminLoginStats.totalFailedAttempts?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unique Users */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-400/30 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-300" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-white/70">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {adminLoginStats.totalUniqueUsers}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Most Active Users */}
            {adminLoginStats?.mostActiveUsers &&
              adminLoginStats.mostActiveUsers.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-600/80 px-6 py-4 rounded-t-xl -mx-6 -mt-6 mb-6">
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-white" />
                      <h3 className="text-xl font-bold text-white">
                        Most Active Users (Last 30 Days)
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {adminLoginStats.mostActiveUsers.map((user, index) => (
                      <div
                        key={user._id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-white font-medium text-sm">
                            {user.userInfo?.[0]?.name || "Unknown"}
                          </p>
                          <p className="text-white/60 text-xs">
                            {user.userInfo?.[0]?.email || "No email"}
                          </p>
                          <p className="text-purple-300 font-bold text-lg mt-1">
                            {user.loginCount}
                          </p>
                          <p className="text-white/50 text-xs">logins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* System Login History Table */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl shadow-lg">
              <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-600/80 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      System Login History
                    </h3>
                  </div>
                  <span className="text-white/70 text-sm">
                    {allLoginHistory.length} records
                  </span>
                </div>
              </div>

              <div className="p-6">
                {loginHistoryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto"></div>
                    <p className="text-white/60 mt-2">
                      Loading login history...
                    </p>
                  </div>
                ) : allLoginHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <p className="text-white/60">No login history found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            Date & Time
                          </th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            User
                          </th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            Location
                          </th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            Method
                          </th>
                          <th className="text-left py-3 px-4 text-white/70 font-medium">
                            IP Address
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allLoginHistory.map((login, index) => (
                          <tr
                            key={login._id || index}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 px-4 text-white/80 text-sm">
                              {formatDate(login.loginTime)}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {login.userId?.name ||
                                    login.email ||
                                    "Unknown User"}
                                </p>
                                {login.userId?.email && (
                                  <p className="text-white/60 text-xs">
                                    {login.userId.email}
                                  </p>
                                )}
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                    login.userId?.role === "Admin"
                                      ? "bg-red-400/20 text-red-300"
                                      : login.userId?.role === "Author"
                                      ? "bg-blue-400/20 text-blue-300"
                                      : login.userId?.role === "User"
                                      ? "bg-green-400/20 text-green-300"
                                      : "bg-gray-400/20 text-gray-300"
                                  }`}
                                >
                                  {login.userId?.role || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  login.success
                                    ? "bg-green-400/20 text-green-300 border border-green-400/30"
                                    : "bg-red-400/20 text-red-300 border border-red-400/30"
                                }`}
                              >
                                {login.success ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Success
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white/70 text-sm">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-white/50" />
                                <span>{login.location || "Unknown"}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-400/20 text-gray-300 border border-gray-400/30">
                                {login.method || "Email/Password"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white/60 text-sm font-mono">
                              {login.ipAddress || "Unknown"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Summary */}
            {adminLoginStats?.recentActivity &&
              adminLoginStats.recentActivity.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="h-5 w-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Recent Login Activity
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {adminLoginStats.recentActivity.map((activity, index) => (
                      <div
                        key={activity._id || index}
                        className="flex items-center space-x-3 py-3 px-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium">
                            {activity.userId?.name || "Unknown User"} logged in
                            successfully
                          </p>
                          <p className="text-white/60 text-xs">
                            {activity.location} • {activity.ipAddress}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-white/50 text-xs">
                            {formatTime(activity.loginTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
