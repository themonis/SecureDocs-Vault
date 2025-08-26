import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";
import {
  Shield,
  BarChart3,
  Settings,
  Home,
  Menu,
  X,
  LogOut,
  User, // ✅ Added for Profile
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ✅ KEEP: Beautiful Logo with Icon */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-bold text-white hover:text-white/80 transition-colors group"
          >
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <span>SecureDocs</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                {/* ✅ KEEP: Dashboard Link with Icon */}
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive("/dashboard")
                      ? "text-white bg-white/10"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {/* ✅ KEEP: Analytics Link with Icon - Only for Authors & Admins */}
                {(user.role === "Author" || user.role === "Admin") && (
                  <Link
                    to="/analytics"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive("/analytics")
                        ? "text-white bg-white/10"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                )}

                {/* ✅ KEEP: Admin Link with Icon - Only for Admins */}
                {user.role === "Admin" && (
                  <Link
                    to="/admin"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive("/admin")
                        ? "text-white bg-white/10"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* ✅ ENHANCED: User Info with Profile Icon Added */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-white/80">
                    <User className="h-4 w-4" />
                    <span>
                      Welcome,{" "}
                      <span className="text-white font-medium">
                        {user.name || user.email}
                      </span>
                    </span>
                  </div>
                  {user.role && (
                    <span
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "Admin"
                          ? "bg-purple-500/20 text-purple-300"
                          : user.role === "Author"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      <span>{user.role}</span>
                    </span>
                  )}

                  {/* ✅ NEW: Profile Icon Button */}
                  <Link
                    to="/profile"
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive("/profile")
                        ? "bg-purple-500/20 text-purple-300"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                    title="Profile Settings"
                  >
                    <User className="h-5 w-5" />
                  </Link>

                  {/* ✅ ENHANCED: Better Logout Button */}
                  <Button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 rounded-lg transition-all duration-200 group"
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Public Navigation */}
                <Link
                  to="/login"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* ✅ KEEP: Mobile Menu Button with Icon Animation */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* ✅ KEEP: Mobile Menu with Icons + Profile Added */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/5 backdrop-blur-sm border-t border-white/20 py-4">
            {user ? (
              <div className="space-y-2">
                {/* ✅ KEEP: Dashboard Link with Icon for Mobile */}
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${
                    isActive("/dashboard") ? "text-white bg-white/10" : ""
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {/* ✅ KEEP: Analytics Link with Icon for Mobile - Only for Authors & Admins */}
                {(user.role === "Author" || user.role === "Admin") && (
                  <Link
                    to="/analytics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${
                      isActive("/analytics") ? "text-white bg-white/10" : ""
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                )}

                {/* ✅ KEEP: Admin Link with Icon for Mobile - Only for Admins */}
                {user.role === "Admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${
                      isActive("/admin") ? "text-white bg-white/10" : ""
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}

                {/* ✅ NEW: Profile Link for Mobile */}
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${
                    isActive("/profile") ? "text-white bg-white/10" : ""
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>

                {/* ✅ KEEP: User Info for Mobile */}
                <div className="flex items-center space-x-2 px-4 py-3 text-white/80">
                  <User className="h-4 w-4" />
                  <span>
                    Welcome,{" "}
                    <span className="text-white font-medium">
                      {user.name || user.email}
                    </span>
                  </span>
                </div>
                {user.role && (
                  <div className="px-4">
                    <span
                      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "Admin"
                          ? "bg-purple-500/20 text-purple-300"
                          : user.role === "Author"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-green-500/20 text-green-300"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      <span>{user.role}</span>
                    </span>
                  </div>
                )}

                {/* ✅ ENHANCED: Better Logout Button for Mobile */}
                <div className="px-4 pt-2">
                  <Button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 rounded-lg transition-all duration-200 group w-full justify-center"
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Logout</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
