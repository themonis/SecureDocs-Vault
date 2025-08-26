import React, { useState, useRef } from "react";
import Button from "../common/Button";
import { fileAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function FileUploader({ onClose, onFileUploaded }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tags, setTags] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);

    try {
      // Upload files one by one since backend expects single file uploads
      const uploadPromises = files.map(async (file, index) => {
        const formData = new FormData();
        formData.append("file", file); // ← Fixed: Changed from 'files' to 'file'

        // Add optional tags if provided
        if (tags.trim()) {
          formData.append("tags", tags.trim());
        }

        // Add expiration if provided
        if (
          expiresInDays &&
          !isNaN(parseInt(expiresInDays)) &&
          parseInt(expiresInDays) > 0
        ) {
          formData.append("expiresInDays", expiresInDays);
        }

        console.log(
          `Uploading file ${index + 1}/${files.length}: ${file.name}`
        );
        return fileAPI.upload(formData);
      });

      const responses = await Promise.all(uploadPromises);

      toast.success(
        `${files.length} file(s) uploaded and encrypted successfully!`
      );

      // Process each successful upload and notify parent component
      responses.forEach((response, index) => {
        if (response.data) {
          const originalFile = files[index];
          const uploadedFile = {
            _id: response.data.fileId,
            uuid: response.data.fileId,
            originalName: originalFile.name,
            fileName: originalFile.name, // Backup field name
            size: originalFile.size,
            uploadDate: new Date(),
            createdAt: new Date(),
            downloadCount: 0,
            expiresAt: response.data.expiresAt,
            downloadLink: response.data.downloadLink,
            tags: tags.trim() ? tags.split(",").map((tag) => tag.trim()) : [],
          };
          onFileUploaded(uploadedFile);
        }
      });

      // Close modal after successful upload
      onClose();
    } catch (error) {
      console.error("Upload error details:", error.response?.data || error);

      // More specific error handling
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error(
          "Invalid file or upload data. Please check your files and try again."
        );
      } else if (error.response?.status === 413) {
        toast.error("File too large. Please choose smaller files.");
      } else if (error.response?.status === 500) {
        toast.error("Server error during upload. Please try again.");
      } else {
        toast.error(
          "Upload failed. Please check your connection and try again."
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-all duration-300 ${
            dragActive
              ? "border-blue-400 bg-blue-400/10"
              : "border-white/30 hover:border-white/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {dragActive ? "Drop files here" : "Drag & drop files here"}
          </h3>
          <p className="text-white/60 mb-4">or</p>
          <Button onClick={() => fileInputRef.current?.click()} variant="glass">
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, important, contract"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            />
            <p className="text-white/50 text-xs mt-1">
              Separate tags with commas
            </p>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Auto-delete after (days)
            </label>
            <input
              type="number"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="30"
              min="1"
              max="365"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            />
            <p className="text-white/50 text-xs mt-1">
              Leave empty for permanent storage
            </p>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-white/50 text-sm">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={uploading}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-200/80 text-sm text-center">
            🔒 All files will be encrypted before storage for maximum security
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end space-x-4">
          <Button onClick={onClose} variant="glass" disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="primary"
            loading={uploading}
            disabled={files.length === 0}
          >
            {uploading
              ? `Uploading ${files.length} file${
                  files.length !== 1 ? "s" : ""
                }...`
              : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
