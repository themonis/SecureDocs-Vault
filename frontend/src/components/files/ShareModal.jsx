/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import { fileAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ShareModal({ file, onClose }) {
  const [shareSettings, setShareSettings] = useState({
    password: "",
    expiresInHours: "",
    maxDownloads: "",
    allowPreview: true,
  });
  const [generatedLink, setGeneratedLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(""); // Countdown timer
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (!generatedLink?.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(generatedLink.expiresAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [generatedLink]);

  const handleGenerateLink = async () => {
    setLoading(true);

    try {
      const options = {};

      if (shareSettings.password.trim()) {
        options.password = shareSettings.password.trim();
      }

      if (
        shareSettings.expiresInHours &&
        !isNaN(parseInt(shareSettings.expiresInHours))
      ) {
        options.expiresIn = `${shareSettings.expiresInHours}h`;
      }

      if (
        shareSettings.maxDownloads &&
        !isNaN(parseInt(shareSettings.maxDownloads))
      ) {
        options.downloadLimit = parseInt(shareSettings.maxDownloads);
      }

      options.allowPreview = shareSettings.allowPreview;

      const response = await fileAPI.generatePublicLink(file.uuid, options);

      const publicUrl = response.data.publicLink || response.data.publicUrl;

      if (response.data && publicUrl) {
        setGeneratedLink({
          url: publicUrl,
          token: response.data.token || response.data.downloadToken,
          expiresAt: response.data.expiresAt,
          hasPassword: !!shareSettings.password.trim(),
        });
        toast.success("Share link generated successfully!");
      } else {
        toast.error(
          "Failed to generate share link - unexpected response format"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate share link"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink.url);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard!");
    }
  };

  const resetForm = () => {
    setGeneratedLink(null);
    setShareSettings({
      password: "",
      expiresInHours: "",
      maxDownloads: "",
      allowPreview: true,
    });
    setTimeLeft("");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-[60] p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-slate-800/98 to-slate-900/98 backdrop-blur-2xl rounded-3xl border border-white/25 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center border border-blue-400/30 shadow-lg">
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Share File
              </h2>
              <p className="text-slate-300">Generate secure sharing link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all duration-300 p-3 rounded-xl hover:bg-white/10 group shadow-lg"
          >
            <svg
              className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300"
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

        {/* File Info */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 rounded-2xl p-6 mb-8 shadow-xl backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/40 to-purple-500/40 rounded-xl flex items-center justify-center border border-indigo-400/30 shadow-lg">
              <svg
                className="w-6 h-6 text-indigo-200"
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
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg truncate">
                {file.originalName}
              </p>
              <p className="text-indigo-200">
                {file.size
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                  : "Unknown size"}
              </p>
            </div>
          </div>
        </div>

        {!generatedLink ? (
          <>
            {/* Share Settings */}
            <div className="space-y-6 mb-8">
              {/* Password */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-yellow-300"
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
                  </div>
                  <label className="block text-white font-semibold">
                    Password Protection
                  </label>
                </div>
                <input
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) =>
                    setShareSettings((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password for extra security (optional)"
                  className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 shadow-lg"
                />
              </div>

              {/* Time and Download Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-orange-300"
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
                    <label className="block text-white font-semibold">
                      Expires in (hours)
                    </label>
                  </div>
                  <input
                    type="number"
                    value={shareSettings.expiresInHours}
                    onChange={(e) =>
                      setShareSettings((prev) => ({
                        ...prev,
                        expiresInHours: e.target.value,
                      }))
                    }
                    placeholder="24"
                    min="1"
                    max="8760"
                    className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 shadow-lg"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <label className="block text-white font-semibold">
                      Max Downloads
                    </label>
                  </div>
                  <input
                    type="number"
                    value={shareSettings.maxDownloads}
                    onChange={(e) =>
                      setShareSettings((prev) => ({
                        ...prev,
                        maxDownloads: e.target.value,
                      }))
                    }
                    placeholder="10"
                    min="1"
                    max="1000"
                    className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300 shadow-lg"
                  />
                </div>
              </div>

              {/* Preview Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shareSettings.allowPreview}
                  onChange={() =>
                    setShareSettings((prev) => ({
                      ...prev,
                      allowPreview: !prev.allowPreview,
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 bg-slate-700 focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-white font-semibold">
                  Allow file preview
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateLink}
                loading={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-lg transition-all duration-300"
              >
                Generate Link
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Generated Link */}
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/20 shadow-lg mb-6 space-y-4">
              <p className="text-slate-200 break-all">{generatedLink.url}</p>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleCopyLink}
                  className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl shadow-lg text-white font-semibold transition-all duration-300"
                >
                  Copy Link
                </Button>
                {generatedLink.hasPassword && (
                  <span className="text-yellow-300 font-semibold px-2 py-1 bg-yellow-900/30 rounded-xl shadow-inner">
                    Password Protected
                  </span>
                )}
                {generatedLink.expiresAt && (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-orange-300"
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
                    <span className="text-orange-200">Expires: {timeLeft}</span>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <div className="flex justify-end">
                <Button
                  onClick={resetForm}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-2xl shadow-lg transition-all duration-300"
                >
                  Generate New Link
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
