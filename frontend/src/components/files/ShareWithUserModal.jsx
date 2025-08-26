import React, { useState, useEffect } from "react";
import { X, UserPlus, Share2, Search } from "lucide-react";
import { fileAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function ShareWithUserModal({
  file,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load available users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, availableUsers]);

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fileAPI.getAvailableUsers();

      if (response.data.success) {
        setAvailableUsers(response.data.data || []);
        setFilteredUsers(response.data.data || []);
      } else {
        toast.error("Failed to load available users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load available users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleShare = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("Please select a user to share with");
      return;
    }

    try {
      setLoading(true);

      // Update the API call to use userId instead of email
      const response = await fileAPI.shareWithUser(
        file.uuid,
        selectedUser.email
      );

      if (response.data.success) {
        toast.success(
          response.data.message ||
            `File shared with ${selectedUser.name || selectedUser.email}!`
        );
        handleClose();
        onSuccess && onSuccess();
      } else {
        toast.error(response.data.message || "Failed to share file");
      }
    } catch (error) {
      console.error("Share error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to share file";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchTerm("");
    setAvailableUsers([]);
    setFilteredUsers([]);
    onClose();
  };

  const getUserInitials = (user) => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.charAt(0).toUpperCase();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Author":
        return "bg-purple-500";
      case "User":
        return "bg-blue-500";
      case "Admin":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Share2 className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Share File</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File Info */}
        <div className="bg-white/5 rounded-lg p-3 mb-6">
          <p className="text-white font-medium text-sm truncate">
            {file.originalName}
          </p>
          <p className="text-white/70 text-xs mt-1">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-hidden mb-6">
          <h4 className="text-white/90 text-sm font-medium mb-3">
            Select user to share with:
          </h4>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <span className="ml-2 text-white/70 text-sm">
                Loading users...
              </span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-white/30 mx-auto mb-2" />
              <p className="text-white/70 text-sm">
                {searchTerm
                  ? "No users found matching your search"
                  : "No users available for sharing"}
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    selectedUser?._id === user._id
                      ? "bg-blue-500/20 border-blue-400/50 text-blue-300"
                      : "bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {/* User Avatar */}
                  <div
                    className={`h-8 w-8 ${getRoleColor(
                      user.role
                    )} rounded-full flex items-center justify-center text-white font-medium text-xs`}
                  >
                    {getUserInitials(user)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">
                      {user.name || "Unknown User"}
                    </p>
                    <p className="text-xs opacity-70 truncate">{user.email}</p>
                    <p className="text-xs opacity-50">{user.role}</p>
                  </div>

                  {/* Selected Indicator */}
                  {selectedUser?._id === user._id && (
                    <div className="h-4 w-4 bg-blue-400 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
            <p className="text-blue-300 text-sm">
              <strong>Selected:</strong> {selectedUser.name || "Unknown User"} (
              {selectedUser.email})
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={loading || !selectedUser}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Share File</span>
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-300 text-xs">
            <strong>Note:</strong> The selected user will be able to download
            and view this file. You can manage sharing permissions from your
            file management page.
          </p>
        </div>
      </div>
    </div>
  );
}
