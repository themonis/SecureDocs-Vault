/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { fileAPI } from "../../services/api";
import Button from "../common/Button";
import ShareModal from "./ShareModal";
import toast from "react-hot-toast";
import ShareWithUserModal from "./ShareWithUserModal";
import { UserPlus } from "lucide-react";

export default function FileList({ files, onFileDeleted, onRefresh }) {
  const [loadingStates, setLoadingStates] = useState({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareWithUserModalOpen, setShareWithUserModalOpen] = useState(false);
  const [selectedFileForUserShare, setSelectedFileForUserShare] =
    useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return (
          <svg
            className="h-6 w-6 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "doc":
      case "docx":
        return (
          <svg
            className="h-6 w-6 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return (
          <svg
            className="h-6 w-6 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const handleDownload = async (file) => {
    setLoadingStates((prev) => ({ ...prev, [file._id]: "downloading" }));
    try {
      const response = await fileAPI.download(file.uuid);

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("File downloaded successfully");
    } catch (error) {
      toast.error("Download failed");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [file._id]: null }));
    }
  };

  
  const handleShare = (file) => {
    setSelectedFile(file);
    setShareModalOpen(true);
  };

  const handleShareWithUser = (file) => {
    setSelectedFileForUserShare(file);
    setShareWithUserModalOpen(true);
  };

  const handleDelete = async (file) => {
    if (
      !window.confirm(`Are you sure you want to delete "${file.originalName}"?`)
    ) {
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [file._id]: "deleting" }));
    try {
      await fileAPI.delete(file.uuid);
      onFileDeleted(file._id);
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [file._id]: null }));
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">My Files</h2>
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file._id}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.originalName)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {file.originalName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-white/60 text-sm">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="text-white/60 text-sm">
                        {formatDate(file.createdAt)}
                      </span>
                      {file.public && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                          Public
                        </span>
                      )}
                      {file.downloadCount > 0 && (
                        <span className="text-white/60 text-sm">
                          {file.downloadCount} downloads
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Download Button */}
                  <Button
                    onClick={() => handleDownload(file)}
                    disabled={loadingStates[file._id] === "downloading"}
                    variant="secondary"
                    size="sm"
                  >
                    {loadingStates[file._id] === "downloading"
                      ? "..."
                      : "Download"}
                  </Button>

                  {/* Public Share Button */}
                  <button
                    onClick={() => handleShare(file)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Create public link"
                  >
                    <svg
                      className="h-4 w-4"
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
                  </button>

                  {/* ✅ NEW: Private Share with User Button */}
                  <button
                    onClick={() => handleShareWithUser(file)}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                    title="Share with registered user"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>

                  {/* Delete Button */}
                  <Button
                    onClick={() => handleDelete(file)}
                    disabled={loadingStates[file._id] === "deleting"}
                    variant="danger"
                    size="sm"
                  >
                    {loadingStates[file._id] === "deleting" ? "..." : "Delete"}
                  </Button>
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
      </div>

      {/* Existing Public Share Modal */}
      {shareModalOpen && (
        <ShareModal
          file={selectedFile}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* ✅ NEW: Private Share with User Modal */}
      {shareWithUserModalOpen && (
        <ShareWithUserModal
          file={selectedFileForUserShare}
          isOpen={shareWithUserModalOpen}
          onClose={() => setShareWithUserModalOpen(false)}
          onSuccess={() => {
            onRefresh && onRefresh();
          }}
        />
      )}
    </>
  );
}
