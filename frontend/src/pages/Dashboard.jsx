import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { fileAPI, activityAPI } from "../services/api";
import Button from "../components/common/Button";
import FileUploader from "../components/files/FileUploader";
import FileList from "../components/files/FileList";
import SharedWithMe from "../components/files/SharedWithMe";
import SearchBar from "../components/search/SearchBar";
import Navbar from "../components/layout/Navbar";
import toast from "react-hot-toast";
import {
  Files,
  HardDrive,
  Download,
  Eye,
  Lock,
  Calendar,
  TrendingUp,
  Activity,
  Globe,
  Shield,
  Clock,
  MapPin,
  FileText,
  Image,
  Video,
  Archive,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentDownloads, setRecentDownloads] = useState([]);

  // Search functionality state
  const [searchResults, setSearchResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");

  // Tab state for role-based navigation
  const [activeTab, setActiveTab] = useState(
    user?.role === "User" ? "shared" : "myFiles"
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (user?.role === "Author" || user?.role === "Admin") {
        const [filesRes, activityRes, downloadsRes] = await Promise.all([
          fileAPI.getMyFiles(),
          activityAPI.getMyActivity(),
          activityAPI.getMyDownloads(),
        ]);
        setFiles(filesRes.data.files || []);
        setRecentActivity((activityRes.data.activities || []).slice(0, 5));
        setRecentDownloads((downloadsRes.data.downloads || []).slice(0, 5));
      } else if (user?.role === "User") {
        setFiles([]);
        setRecentActivity([]);
        setRecentDownloads([]);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
    setUploadModalOpen(false);
    toast.success("File uploaded successfully!");
    loadDashboardData();
    if (isSearchMode && searchQuery) {
      handleSearch(searchResults, searchQuery);
    }
  };

  const handleFileDeleted = (deletedFileId) => {
    setFiles((prev) => prev.filter((file) => file._id !== deletedFileId));
    loadDashboardData();
    if (isSearchMode && searchResults) {
      setSearchResults((prev) =>
        prev.filter((file) => file._id !== deletedFileId)
      );
    }
  };

  const handleSearch = async (results, query) => {
    setSearchResults(results);
    setSearchQuery(query);
    setIsSearchMode(true);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery("");
    setIsSearchMode(false);
  };

  const processedFiles = () => {
    if (user?.role !== "Author" && user?.role !== "Admin") return [];

    let filteredFiles = isSearchMode ? searchResults : files;

    if (filterBy !== "all") {
      filteredFiles = filteredFiles.filter((file) =>
        filterBy === "public" ? file.public : !file.public
      );
    }

    const sortedFiles = [...(filteredFiles || [])].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.originalName.localeCompare(b.originalName);
        case "size":
          return (b.size || 0) - (a.size || 0);
        case "downloads":
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        case "recent":
        default:
          return (
            new Date(b.createdAt || b.uploadDate) -
            new Date(a.createdAt || a.uploadDate)
          );
      }
    });

    return sortedFiles;
  };

  const currentFiles = processedFiles();
  const currentFilesCount = currentFiles?.length || 0;

  const dashboardAnalytics =
    user?.role === "Author" || user?.role === "Admin"
      ? {
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
          popularFile: files.reduce(
            (prev, current) =>
              (prev.downloadCount || 0) > (current.downloadCount || 0)
                ? prev
                : current,
            files[0] || {}
          ),
        }
      : null;

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Unknown Time";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown Time";
    return date.toLocaleString();
  };

  // Helper function to get activity icon
  const getActivityIcon = (action) => {
    switch (action.toLowerCase()) {
      case "upload":
        return <FileText className="h-4 w-4 text-blue-400" />;
      case "download":
        return <Download className="h-4 w-4 text-green-400" />;
      case "delete":
        return <Archive className="h-4 w-4 text-red-400" />;
      case "view":
        return <Eye className="h-4 w-4 text-purple-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <Image className="h-4 w-4 text-green-400" />;
      case "mp4":
      case "avi":
      case "mov":
      case "mkv":
        return <Video className="h-4 w-4 text-red-400" />;
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
        return <FileText className="h-4 w-4 text-blue-400" />;
      default:
        return <Files className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80 text-lg">Loading your dashboard...</p>
            <p className="text-white/60 text-sm mt-2">
              {user?.role === "User"
                ? "Loading shared files..."
                : "Manage your secure documents with advanced features and insights"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Role-based welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {user?.role === "User" ? "Your Shared Files" : "Dashboard"}
          </h1>
          <p className="text-white/70 text-lg">
            {user?.role === "User"
              ? "Access and download files shared with you"
              : "Manage your secure documents with advanced features and insights"}
          </p>
        </div>

        {/* Role-based tabs for Authors & Admins */}
        {(user?.role === "Author" || user?.role === "Admin") && (
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
              <button
                onClick={() => setActiveTab("myFiles")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "myFiles"
                    ? "bg-blue-600 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                My Files
              </button>
              <button
                onClick={() => setActiveTab("shared")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === "shared"
                    ? "bg-blue-600 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Shared With Me
              </button>
              {user?.role === "Admin" && (
                <button
                  onClick={() => (window.location.href = "/admin")}
                  className="px-6 py-2 rounded-lg font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 transition-colors"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Role-based content rendering for Authors & Admins */}
        {(user?.role === "Author" || user?.role === "Admin") &&
          activeTab === "myFiles" && (
            <>
              {/* Beautiful Analytics Cards - Restored Original Styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Files Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                          <Files className="h-5 w-5 text-blue-400" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">
                          Total Files
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">
                          {currentFilesCount}
                          {isSearchMode && (
                            <span className="text-sm text-white/60 ml-1 font-normal">
                              of {files.length}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-green-400" />
                          <p className="text-white/50 text-xs">
                            {dashboardAnalytics.recentUploads} uploaded this
                            week
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Files className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage Used Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                          <HardDrive className="h-5 w-5 text-purple-400" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">
                          Storage Used
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">
                          {formatBytes(dashboardAnalytics.totalSize)}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-purple-400" />
                          <p className="text-white/50 text-xs">
                            Avg:{" "}
                            {formatBytes(
                              dashboardAnalytics.totalSize /
                                Math.max(dashboardAnalytics.totalFiles, 1)
                            )}{" "}
                            per file
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <HardDrive className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Downloads Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                          <Download className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">
                          Total Downloads
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">
                          {dashboardAnalytics.totalDownloads}
                        </p>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-green-400" />
                          <p className="text-white/50 text-xs truncate">
                            Popular:{" "}
                            {dashboardAnalytics.popularFile.originalName?.substring(
                              0,
                              15
                            ) || "N/A"}
                            ...
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                          <Download className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                          <Eye className="h-5 w-5 text-orange-400" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">
                          Visibility
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-green-400" />
                            <span className="text-white/80 text-sm">
                              Public
                            </span>
                          </div>
                          <span className="text-xl font-bold text-green-400">
                            {dashboardAnalytics.publicFiles}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4 text-blue-400" />
                            <span className="text-white/80 text-sm">
                              Private
                            </span>
                          </div>
                          <span className="text-xl font-bold text-blue-400">
                            {dashboardAnalytics.privateFiles}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-right">
                        <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Controls */}
              <div className="mb-8">
                <SearchBar
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  isSearchMode={isSearchMode}
                  searchQuery={searchQuery}
                />
              </div>

              {/* Upload Button */}
              <div className="flex justify-center mb-8">
                <Button
                  onClick={() => setUploadModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Upload New File
                </Button>
              </div>

              {/* File List */}
              <FileList
                files={currentFiles}
                onFileDeleted={handleFileDeleted}
                onRefresh={loadDashboardData}
                viewMode={viewMode}
                setViewMode={setViewMode}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
                isSearchMode={isSearchMode}
                searchQuery={searchQuery}
              />

              {/* File Uploader Modal */}
              {uploadModalOpen && (
                <FileUploader
                  onFileUploaded={handleFileUploaded}
                  onClose={() => setUploadModalOpen(false)}
                />
              )}
            </>
          )}

        {/* SharedWithMe component */}
        {(user?.role === "User" ||
          (user?.role === "Author" && activeTab === "shared") ||
          (user?.role === "Admin" && activeTab === "shared")) && (
          <SharedWithMe />
        )}

        {/* Beautiful Activity and Downloads with Icons */}
        {(user?.role === "Author" || user?.role === "Admin") &&
          activeTab === "myFiles" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Recent Activity - Enhanced */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Activity className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent Activity
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 py-3 px-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium">
                            {activity.action.toUpperCase()}{" "}
                            {activity.details || `File ${activity.action}`}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 text-white/40" />
                            <p className="text-white/50 text-xs">
                              {formatTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-white/30 mx-auto mb-2" />
                      <p className="text-white/60 text-sm">
                        No recent activity
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Downloads - Enhanced */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center space-x-2 mb-4">
                  <Download className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Recent Downloads
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentDownloads.length > 0 ? (
                    recentDownloads.map((download, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 py-3 px-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getFileTypeIcon(download.fileName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium truncate">
                            {download.fileName || "Unknown File"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <MapPin className="h-3 w-3 text-white/40" />
                            <p className="text-white/50 text-xs">
                              {download.ipAddress || "Unknown IP"}
                            </p>
                            <Clock className="h-3 w-3 text-white/40" />
                            <p className="text-white/50 text-xs">
                              {formatTime(
                                download.downloadTime || download.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Download className="h-12 w-12 text-white/30 mx-auto mb-2" />
                      <p className="text-white/60 text-sm">
                        No recent downloads
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
