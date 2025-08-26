import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ Import Link and useNavigate
import Button from "../components/common/Button";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import OTPVerification from "../components/auth/OTPVerification"; // ✅ Import your component
import toast from "react-hot-toast";
import { authAPI } from "../services/api";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const navigate = useNavigate(); // ✅ Use the navigate hook

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;
    if (!name?.trim() || !email?.trim() || !password || !confirmPassword) {
      return toast.error("Please fill in all fields");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    // Note: You should add your password policy check here as well

    setLoading(true);
    try {
      await authAPI.sendSignupOTP(email.trim());
      toast.success("OTP sent to your email!");
      setShowOTP(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ This new function is called by OTPVerification on success
  // eslint-disable-next-line no-unused-vars
  const handleSignupVerified = (response) => {
    toast.success("Account created successfully!");
    setTimeout(() => {
      navigate("/login"); // Use navigate for better SPA routing
    }, 1000);
  };

  // ✅ This new function contains the signup API logic and is passed to OTPVerification
  const handleOTPSubmit = async (otpCode) => {
    const { name, email, password, confirmPassword } = formData;
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await authAPI.signup(
        name.trim(),
        email.trim(),
        password,
        confirmPassword,
        otpCode
      );
      return response; // Return the response on success
    } catch (error) {
      throw error; // Throw error to be caught by OTPVerification's handler
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {showOTP ? "Verify Your Email" : "Join SecureDocs"}
          </h1>
          <p className="text-white/70">
            {showOTP
              ? `Enter the 6-digit code sent to ${formData.email}`
              : "Create your secure document account"}
          </p>
        </div>

        {!showOTP ? (
          <>
            {/* The initial signup form remains the same */}
            <div className="mb-6">
              <GoogleLoginButton text="Sign up with Google" />
            </div>
            {/* ... your divider ... */}
            <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-white/50 text-sm">
                or continue with email
              </span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* ... your form inputs ... */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 8 chars with uppercase, number, symbol"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                size="lg"
                className="w-full"
              >
                {loading ? "Sending OTP..." : "Send Verification Code"}
              </Button>
            </form>
          </>
        ) : (
          // ✅ When showOTP is true, we now render your advanced component
          <OTPVerification
            email={formData.email}
            onVerified={handleSignupVerified}
            onBack={() => setShowOTP(false)}
            onResend={() => authAPI.sendSignupOTP(formData.email)}
            submissionHandler={handleOTPSubmit}
          />
        )}

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            Already have an account? {/* ✅ Use Link for better navigation */}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
