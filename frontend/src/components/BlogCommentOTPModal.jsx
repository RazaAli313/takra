import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

const BlogCommentOTPModal = ({ email, postId, onVerified, onClose }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Send OTP when modal opens
  useEffect(() => {
    if (email && isValidEmail(email)) {
      sendOTP();
    } else if (email) {
      setError("Please enter a valid email address");
      toast.error("Invalid email address");
    }
    // Timer for resend
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timer);
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [email]);

  const sendOTP = async () => {
    // Validate email before sending
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      toast.error("Invalid email address");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      await axios.get(`${API_BASE_URL}/otp/generate`, { params: { email } });
      setSuccess("OTP sent to " + email);
      setResendTimer(60);
      toast.success("OTP sent to your email!");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to send OTP";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e, idx) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);
    
    // Auto-focus next input
    if (value && idx < 5) {
      const nextInput = e.target.parentElement.children[idx + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const prevInput = e.target.parentElement.children[idx - 1];
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }
    try {
      // Verify OTP for blog comment
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', parseInt(otpValue));
      
      const response = await axios.post(
        `${API_BASE_URL}/posts/${postId}/comments/verify-email`,
        formData
      );
      setSuccess("Email verified!");
      toast.success("Email verified successfully!");
      // Pass verification token to parent
      onVerified(response.data.verification_token);
    } catch (err) {
      setError(err.response?.data?.detail || "OTP verification failed");
      toast.error(err.response?.data?.detail || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Verify Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          Enter the 6-digit OTP sent to <span className="text-cyan-400 font-semibold">{email}</span>
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-12 h-12 text-center text-xl bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                autoFocus={idx === 0}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <div className="mt-4 flex justify-between items-center text-sm">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={sendOTP}
            disabled={resendTimer > 0 || isLoading}
            className="text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogCommentOTPModal;

