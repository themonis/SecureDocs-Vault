import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import Button from "../components/common/Button";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import OTPVerification from "../components/auth/OTPVerification";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "Admin") {
        navigate("/admin");
      } else if (user?.role === "Guest") {
        navigate("/guest-landing");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginRequest = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.error("Please fill in all fields");
    }

    if (!email.includes("@")) {
      return toast.error("Please enter a valid email address");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    setLoading(true);
    try {
      await authAPI.loginRequest(email, password);
      toast.success("OTP sent to your email!");
      setShowOTP(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (otpCode) => {
    return await authAPI.verifyOTP(email, otpCode);
  };

  const handleOTPVerified = (response) => {
    console.log("🔍 handleOTPVerified called with:", response);
    console.log("🔍 Response type:", typeof response);
    console.log("🔍 Response keys:", Object.keys(response || {}));
    console.log("🔍 Response.token:", response?.token);
    console.log("🔍 Response.user:", response?.user);

    try {
      const { token, user } = response;
      console.log("🔍 Extracted token:", token);
      console.log("🔍 Extracted user:", user);

      login(token, user);
      toast.success(`Welcome back, ${user.name || user.email}!`);
    } catch (error) {
      console.error("❌ Error in handleOTPVerified:", error);
    }
  };

  if (showOTP) {
    return (
      <OTPVerification
        email={email}
        onBack={() => setShowOTP(false)}
        onResend={() => authAPI.loginRequest(email, password)}
        submissionHandler={handleOTPSubmit}
        onVerified={handleOTPVerified}
        onSuccess={handleOTPVerified}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70">Sign in to your SecureDocs account</p>
        </div>

        {/* Google Login Button */}
        <div className="mb-6">
          <GoogleLoginButton />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white/70">
              or continue with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginRequest} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-white/80 font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/50" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white/80 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/50" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-purple-300 hover:text-purple-200 text-sm underline transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
            className="transform hover:scale-105 transition-transform"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending OTP...</span>
              </div>
            ) : (
              "Continue with Email"
            )}
          </Button>
        </form>

        {/* Sign up link */}
        <div className="text-center mt-6">
          <p className="text-white/70">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-white/60 text-xs">
              🔐 Your login is protected with 2FA authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
