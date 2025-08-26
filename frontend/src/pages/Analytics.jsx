import React, { useState, useEffect } from "react";
import { fileAPI, activityAPI } from "../services/api";
import Navbar from "../components/layout/Navbar";
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
import { Line, Doughnut, Bar, Pie } from "react-chartjs-2";
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

export default function Analytics() {
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [downloadTrends, setDownloadTrends] = useState([]);
  const [fileTypeStats, setFileTypeStats] = useState([]);
  const [popularFiles, setPopularFiles] = useState([]);
  const [geoStats, setGeoStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      const [
        filesRes,
        activitiesRes,
        downloadsRes,
        trendsRes,
        fileTypesRes,
        popularGeoRes,
      ] = await Promise.all([
        fileAPI.getMyFiles(),
        activityAPI.getMyActivity(),
        activityAPI.getMyDownloads(),
        fileAPI.getDownloadTrends(timeRange),
        fileAPI.getFileTypeStats(),
        fileAPI.getPopularFilesAndGeo(),
      ]);

      setFiles(filesRes.data.files || []);
      setActivities(activitiesRes.data.activities || []);
      setDownloads(downloadsRes.data.downloads || []);
      setDownloadTrends(trendsRes.data.trends || []);
      setFileTypeStats(fileTypesRes.data.fileTypes || []);
      setPopularFiles(popularGeoRes.data.popularFiles || []);
      setGeoStats(popularGeoRes.data.geoStats || []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Analytics Calculations
  const analytics = {
    totalFiles: files.length,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
    totalDownloads: files.reduce(
      (acc, file) => acc + (file.downloadCount || 0),
      0
    ),
    publicFiles: files.filter((file) => file.public).length,
    privateFiles: files.filter((file) => !file.public).length,
    recentUploads: files.filter((file) => {
      const uploadDate = new Date(file.createdAt || file.uploadDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return uploadDate > weekAgo;
    }).length,
    totalActivities: activities.length,
    uniqueDownloadIPs: [...new Set(downloads.map((d) => d.ipAddress))].length,
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid";
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Unknown Time";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString();
  };

  // Enhanced Chart Data
  const trendsChartData = {
    labels: downloadTrends.map((trend) => formatDate(trend.date)),
    datasets: [
      {
        label: "Downloads",
        data: downloadTrends.map((trend) => trend.downloads),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const fileTypeColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#F97316",
    "#84CC16",
    "#EC4899",
    "#6B7280",
  ];

  const fileTypeChartData = {
    labels: fileTypeStats.map((type) => type._id.toUpperCase()),
    datasets: [
      {
        data: fileTypeStats.map((type) => type.count),
        backgroundColor: fileTypeColors,
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    ],
  };

  const popularFilesChartData = {
    labels: popularFiles.map((file) =>
      file.originalName.length > 20
        ? file.originalName.substring(0, 20) + "..."
        : file.originalName
    ),
    datasets: [
      {
        label: "Downloads",
        data: popularFiles.map((file) => file.downloadCount),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Activity Type Distribution
  const activityTypes = activities.reduce((acc, activity) => {
    acc[activity.action] = (acc[activity.action] || 0) + 1;
    return acc;
  }, {});

  const activityChartData = {
    labels: Object.keys(activityTypes),
    datasets: [
      {
        data: Object.values(activityTypes),
        backgroundColor: fileTypeColors,
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.9)",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "rgba(255, 255, 255, 0.8)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      x: {
        ticks: { color: "rgba(255, 255, 255, 0.8)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-white/70 ml-4">Loading enhanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header with Tabs */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-white/70 text-lg mb-6">
            Comprehensive insights into your file usage, security, and user
            behavior
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20">
              {["overview", "activity", "security", "performance"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg transition-all ${
                      activeTab === tab
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-center space-x-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === days
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Total Files</h3>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-300">
              {analytics.totalFiles}
            </p>
            <p className="text-sm text-white/60 mt-1">
              {analytics.recentUploads} uploaded this week
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Storage Used</h3>
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-300">
              {formatBytes(analytics.totalSize)}
            </p>
            <p className="text-sm text-white/60 mt-1">Across all files</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                Total Downloads
              </h3>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-300">
              {analytics.totalDownloads}
            </p>
            <p className="text-sm text-white/60 mt-1">
              From {analytics.uniqueDownloadIPs} unique IPs
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">File Privacy</h3>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-300">
                  {analytics.publicFiles}
                </p>
                <p className="text-xs text-white/60">Public</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-300">
                  {analytics.privateFiles}
                </p>
                <p className="text-xs text-white/60">Private</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Download Trends Chart */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Download Trends ({timeRange} days)
                </h3>
                <div className="h-64">
                  <Line data={trendsChartData} options={chartOptions} />
                </div>
              </div>

              {/* File Type Distribution */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                    />
                  </svg>
                  File Type Distribution
                </h3>
                <div className="h-64">
                  {fileTypeStats.length > 0 ? (
                    <Doughnut
                      data={fileTypeChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            position: "bottom",
                            labels: { color: "white", padding: 20 },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      No file types to display
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Popular Files */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  Most Popular Files
                </h3>
                <div className="h-64">
                  {popularFiles.length > 0 ? (
                    <Bar data={popularFilesChartData} options={chartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      No download data available
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Type Distribution */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-orange-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                    />
                  </svg>
                  User Activity Types
                </h3>
                <div className="h-64">
                  {Object.keys(activityTypes).length > 0 ? (
                    <Pie
                      data={activityChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          legend: {
                            position: "right",
                            labels: { color: "white", padding: 20 },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60">
                      No activity data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "activity" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Recent Activity */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-300"
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
                Recent Activity ({activities.length} total)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.slice(0, 20).map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-2 ${
                          activity.action === "download"
                            ? "bg-green-400"
                            : activity.action === "upload"
                            ? "bg-blue-400"
                            : activity.action === "delete"
                            ? "bg-red-400"
                            : activity.action === "share"
                            ? "bg-yellow-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-white font-medium flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs mr-2 ${
                              activity.action === "download"
                                ? "bg-green-400/20 text-green-300"
                                : activity.action === "upload"
                                ? "bg-blue-400/20 text-blue-300"
                                : activity.action === "delete"
                                ? "bg-red-400/20 text-red-300"
                                : activity.action === "share"
                                ? "bg-yellow-400/20 text-yellow-300"
                                : "bg-gray-400/20 text-gray-300"
                            }`}
                          >
                            {activity.action.toUpperCase()}
                          </span>
                          {activity.action} action
                        </p>
                        <p className="text-white/60 text-sm">
                          {activity.details || "No additional details"}
                        </p>
                        {activity.ipAddress && (
                          <p className="text-white/40 text-xs mt-1">
                            IP: {activity.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">
                        {formatTime(activity.createdAt || activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-white/60 text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </div>

            {/* Enhanced Recent Downloads */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Recent Downloads ({downloads.length} total)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {downloads.slice(0, 20).map((download, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          download.status === "success"
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-white font-medium truncate max-w-48">
                          {download.fileName || "Unknown File"}
                        </p>
                        <div className="flex items-center space-x-2 text-white/60 text-sm">
                          <span>{download.ipAddress || "Unknown IP"}</span>
                          {download.location && (
                            <>
                              <span>•</span>
                              <span>{download.location}</span>
                            </>
                          )}
                        </div>
                        {download.method && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs mt-1 inline-block ${
                              download.method === "Personal"
                                ? "bg-blue-400/20 text-blue-300"
                                : "bg-yellow-400/20 text-yellow-300"
                            }`}
                          >
                            {download.method}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">
                        {formatTime(
                          download.downloadTime || download.createdAt
                        )}
                      </p>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          download.status === "success"
                            ? "bg-green-400"
                            : "bg-red-400"
                        } ml-auto mt-1`}
                      ></div>
                    </div>
                  </div>
                ))}
                {downloads.length === 0 && (
                  <p className="text-white/60 text-center py-8">
                    No recent downloads
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Geographic Distribution */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-yellow-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Download Locations (Security Monitoring)
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {geoStats.length > 0 ? (
                  geoStats.map((geo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-yellow-300 font-bold text-sm">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-white font-medium">
                            {geo._id || "Unknown Location"}
                          </span>
                          <p className="text-white/60 text-sm">
                            Access location
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-300 font-bold">
                          {geo.downloads}
                        </span>
                        <p className="text-white/60 text-sm">downloads</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-8 text-white/60">
                    No geographic data available
                  </div>
                )}
              </div>
            </div>

            {/* Security Summary */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-red-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Security Overview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-white">Unique Download IPs</span>
                  </div>
                  <span className="text-green-300 font-bold">
                    {analytics.uniqueDownloadIPs}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-white">Total Activities</span>
                  </div>
                  <span className="text-blue-300 font-bold">
                    {analytics.totalActivities}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-white">Public Files</span>
                  </div>
                  <span className="text-yellow-300 font-bold">
                    {analytics.publicFiles}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-white">Private Files</span>
                  </div>
                  <span className="text-purple-300 font-bold">
                    {analytics.privateFiles}
                  </span>
                </div>

                {activities.filter((a) => a.action === "unauthorized").length >
                  0 && (
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-red-300">
                        Unauthorized Attempts
                      </span>
                    </div>
                    <span className="text-red-300 font-bold">
                      {
                        activities.filter((a) => a.action === "unauthorized")
                          .length
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-green-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                />
              </svg>
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-blue-300">
                  {analytics.totalFiles}
                </p>
                <p className="text-white/70">Total Files Managed</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-green-300">
                  {analytics.totalDownloads}
                </p>
                <p className="text-white/70">Successful Downloads</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <p className="text-3xl font-bold text-purple-300">
                  {analytics.totalFiles > 0
                    ? Math.round(
                        analytics.totalDownloads / analytics.totalFiles
                      )
                    : 0}
                </p>
                <p className="text-white/70">Avg Downloads/File</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
