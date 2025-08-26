/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import Button from "../common/Button";
import toast from "react-hot-toast";

// It must accept 'submissionHandler' as a prop
export default function OTPVerification({
  email,
  onVerified,
  onBack,
  onResend,
  submissionHandler,
}) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length === 6) {
      setOtp(pastedData.split(""));
      inputs.current[5]?.focus();
    }
  };

  // ✅ This is the corrected handleSubmit function
  const handleSubmit = async (e) => {
    console.log("Verify button was clicked!");
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    console.log("🔍 About to verify OTP:", otpCode); // ✅ ADD THIS
    console.log("🔍 Email for verification:", email); // ✅ ADD THIS (if email is available)

    setLoading(true);
    try {
      console.log("🔍 Calling submissionHandler..."); // ✅ ADD THIS
      const response = await submissionHandler(otpCode);
      console.log("🔍 Got response from API:", response); // ✅ ADD THIS
      console.log("🔍 Response type:", typeof response); // ✅ ADD THIS

      console.log("🔍 About to call onVerified..."); // ✅ ADD THIS
      onVerified(response);
      console.log("🔍 onVerified called successfully!"); // ✅ ADD THIS
    } catch (error) {
      console.log("❌ Error in handleSubmit:", error); // ✅ ADD THIS
      console.log("❌ Error response:", error.response); // ✅ ADD THIS
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resending) return;
    setResending(true);
    try {
      await onResend(email);
      toast.success("New OTP sent to your email!");
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  // Your JSX for the form does not need to change
  return (
    // ... Your existing JSX for the OTP form ...
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-white/70">
            We've sent a 6-digit verification code to <br />
            <span className="font-medium text-white">{email}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-3 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            ))}
          </div>
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <button
            onClick={handleResendOTP}
            disabled={resending}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend OTP"}
          </button>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-white/60 hover:text-white/80 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
