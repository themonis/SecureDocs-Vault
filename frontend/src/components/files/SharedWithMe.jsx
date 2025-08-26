/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Download, Calendar, User, FileText, AlertCircle } from "lucide-react";
import { fileAPI } from "../../services/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function SharedWithMe() {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedFiles();
  }, []);

  const loadSharedFiles = async () => {
    try {
      setLoading(true);
      const response = await fileAPI.getSharedWithMe();

      console.log("API Response:", response.data); // 🔍 Debug log

      // Handle different possible response structures
      let files = [];
      if (response.data.data) {
        files = response.data.data; // Standard: { success: true, data: [...] }
      } else if (response.data.files) {
        files = response.data.files; // Alternative: { success: true, files: [...] }
      } else if (Array.isArray(response.data)) {
        files = response.data; // Direct array response
      }

      setSharedFiles(files);
    } catch (error) {
      console.error("Error loading shared files:", error);
      toast.error("Failed to load shared files");
      setSharedFiles([]); // ✅ Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await fileAPI.downloadFile(file.uuid);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "🖼️";
    if (["pdf"].includes(extension)) return "📄";
    if (["doc", "docx"].includes(extension)) return "📝";
    if (["xls", "xlsx"].includes(extension)) return "📊";
    if (["ppt", "pptx"].includes(extension)) return "📽️";
    if (["zip", "rar", "7z"].includes(extension)) return "📦";
    return "📄";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading shared files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-2 mb-6">
        <User className="h-5 w-5 text-green-400" />
        <h2 className="text-xl font-semibold text-white">
          Files Shared With Me
        </h2>
        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
          {sharedFiles.length} files
        </span>
      </div>

      {sharedFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 text-lg mb-2">No shared files</p>
          <p className="text-white/50 text-sm">
            Files shared with you by other users will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sharedFiles.map((file) => (
            <div
              key={file._id}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl">
                    {getFileIcon(file.originalName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {file.originalName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-white/60 text-sm">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-white/60 text-sm flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Shared by{" "}
                        {file.owner?.name || file.owner?.email || "Unknown"}
                      </span>
                      <span className="text-white/60 text-sm flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(file.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* File Tags */}
              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
