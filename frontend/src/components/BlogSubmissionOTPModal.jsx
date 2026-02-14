import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { toast } from "react-hot-toast";
import { XMarkIcon } from "@heroicons/react/24/outline";

const BlogSubmissionOTPModal = ({ email, onVerified, onClose }) => {
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
      await axios.get(`${API_BASE_URL}/submissions/otp/generate`, { params: { email } });
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
      // Verify OTP for blog submission
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', parseInt(otpValue));
      
      const response = await axios.post(
        `${API_BASE_URL}/submissions/verify-email`,
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
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          We've sent a 6-digit verification code to <span className="font-semibold text-teal-400">{email}</span>. 
          Please enter it below to verify your email.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-12 h-14 text-center text-2xl font-bold text-white bg-gray-800 border-2 border-gray-700 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={sendOTP}
              disabled={isLoading || resendTimer > 0}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogSubmissionOTPModal;

