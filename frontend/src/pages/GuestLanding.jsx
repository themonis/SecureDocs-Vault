/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { roleAPI } from "../services/api";

import {
  UserPlus,
  Clock,
  Shield,
  FileText,
  User,
  PenTool,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/layout/Navbar";
import { Link } from "react-router-dom"; // ✅ ADD: Import Link

import toast from "react-hot-toast";

export default function GuestLanding() {
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestedRole, setRequestedRole] = useState("");
  const [reason, setReason] = useState("");
  const { user, logout } = useAuth();

  // ✅ UPDATED: Role-based validation - reason mandatory only for Author role
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requestedRole) {
      toast.error("Please select a role");
      return;
    }

    // Role-based validation
    if (requestedRole === "Author") {
      if (!reason.trim()) {
        toast.error("Reason is required for Author role requests");
        return;
      }

      if (reason.trim().length < 10) {
        toast.error(
          "Please provide a detailed reason for Author access (at least 10 characters)"
        );
        return;
      }
    }

    try {
      setLoading(true);

      // ✅ FIXED: Correct axios usage
      const response = await roleAPI.submitRequest(
        requestedRole,
        reason.trim() || "User access for shared files"
      );

      // ✅ FIXED: Use response.data instead of response.json()
      if (response.data.success) {
        toast.success("Role request submitted successfully!");
        setRequestSent(true);
        setRequestedRole("");
        setReason("");
      } else {
        toast.error(response.data.message || "Failed to submit request");
      }
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response data:", error.response?.data);

      // ✅ IMPROVED: Better error handling for axios
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error("Request validation failed. Please check your input.");
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to SecureDocs
            </h1>

            <p className="text-white/80 text-lg mb-6">
              Hello{" "}
              <span className="font-semibold text-white">
                {user?.name || user?.email}
              </span>
            </p>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium">
                  Guest Access
                </span>
              </div>
              <p className="text-white/80 text-sm">
                Your account has <strong>Guest</strong> access. Request an
                upgrade to access file management features.
              </p>
            </div>

            {requestSent ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                  <span className="text-green-300 font-semibold text-lg">
                    Request Submitted!
                  </span>
                </div>
                <p className="text-white/80 mb-4">
                  Your role upgrade request has been sent to the administrators.
                  You'll receive access once approved.
                </p>
                <p className="text-white/60 text-sm">
                  Check back later or contact your administrator for status
                  updates.
                </p>
                <button
                  onClick={() => setRequestSent(false)}
                  className="mt-4 text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <button
                onClick={() => setRequestSent(false)}
                className="text-purple-300 hover:text-purple-200 text-sm underline"
              >
                Request Role Upgrade
              </button>
            )}
          </div>
        </div>

        {/* ✅ ENHANCED: Role Request Form with Dynamic Validation */}
        {!requestSent && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Request Role Upgrade
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-white/80 font-medium mb-4">
                    Select Desired Role
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Role Option */}
                    <div
                      onClick={() => setRequestedRole("User")}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        requestedRole === "User"
                          ? "border-green-500/50 bg-green-500/20"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">
                            User Access
                          </h3>
                          <span className="text-green-400 text-xs font-medium">
                            Reason Optional
                          </span>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-2">
                        View and download files shared with you
                      </p>
                      <ul className="text-white/60 text-xs space-y-1">
                        <li>• Access shared documents</li>
                        <li>• Download files securely</li>
                        <li>• Basic dashboard access</li>
                      </ul>
                    </div>

                    {/* Author Role Option */}
                    <div
                      onClick={() => setRequestedRole("Author")}
                      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        requestedRole === "Author"
                          ? "border-blue-500/50 bg-blue-500/20"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <PenTool className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">
                            Author Access
                          </h3>
                          <span className="text-yellow-400 text-xs font-medium">
                            Reason Required
                          </span>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mb-2">
                        Upload, manage, and share your own files
                      </p>
                      <ul className="text-white/60 text-xs space-y-1">
                        <li>• Upload and manage files</li>
                        <li>• Share files with others</li>
                        <li>• Full dashboard features</li>
                        <li>• Analytics and insights</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* ✅ ENHANCED: Dynamic Reason Field with Role-Based Requirements */}
                <div>
                  <label className="flex items-center space-x-2 text-white/80 font-medium mb-3">
                    <MessageSquare className="h-4 w-4" />
                    <span>Reason for Request</span>
                    {requestedRole === "Author" && (
                      <span className="text-red-400">*</span>
                    )}
                    {requestedRole === "User" && (
                      <span className="text-green-400">(Optional)</span>
                    )}
                  </label>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      requestedRole === "Author"
                        ? "Please explain why you need Author access and how you plan to use file management features..."
                        : requestedRole === "User"
                        ? "Optional: Brief explanation of your intended use (helps with faster approval)..."
                        : "Please explain why you need this role and how you plan to use SecureDocs..."
                    }
                    className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-colors resize-none"
                    rows={4}
                  />

                  <div className="flex justify-between items-center mt-2">
                    {requestedRole === "Author" ? (
                      <p className="text-yellow-400 text-xs">
                        <strong>Required:</strong> Detailed explanation needed
                        for Author access (minimum 20 characters)
                      </p>
                    ) : requestedRole === "User" ? (
                      <p className="text-green-400 text-xs">
                        <strong>Optional:</strong> Reason helps administrators
                        process your request faster
                      </p>
                    ) : (
                      <p className="text-white/50 text-xs">
                        Select a role to see requirements
                      </p>
                    )}

                    {requestedRole === "Author" && (
                      <span
                        className={`text-xs ${
                          reason.length < 20 ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {reason.length}/20
                      </span>
                    )}
                  </div>
                </div>

                {/* ✅ ENHANCED: Submit Button with Dynamic Validation */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !requestedRole ||
                    (requestedRole === "Author" && reason.length < 20) // Only block for Author role
                  }
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Submit {requestedRole} Role Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ✅ ENHANCED: Role Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  User Benefits
                </h3>
                <p className="text-green-400 text-xs">
                  Quick approval - reason optional
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>Access files shared with you</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>Download documents securely</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>View shared file details</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span>Basic dashboard access</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <PenTool className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  Author Benefits
                </h3>
                <p className="text-yellow-400 text-xs">
                  Requires detailed justification
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-white/70">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Upload and organize files</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Share files with team members</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Advanced analytics dashboard</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span>Full file management control</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3">
              <AlertCircle className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Need Help?</h3>
            <p className="text-white/70 text-sm mb-4">
              Contact your administrator or check back later for approval
              status.
            </p>
            <button
              onClick={logout}
              className="text-red-300 hover:text-red-200 text-sm underline transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
