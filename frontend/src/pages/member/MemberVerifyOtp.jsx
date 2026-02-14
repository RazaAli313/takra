import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { ShieldCheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const MemberVerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("memberLoginEmail");
    if (!storedEmail) {
      toast.error("Please login first");
      navigate("/member/login");
      return;
    }
    setEmail(storedEmail);

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [navigate]);

  useEffect(() => {
    // Resend cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pastedData.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    
    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex(d => !d);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      // Auto-submit if complete
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  const handleVerify = async (otpValue = null) => {
    const fullOtp = otpValue || otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/member/auth/verify-otp`, {
        email: email,
        otp: parseInt(fullOtp)
      });

      // Store token
      localStorage.setItem("memberAuthToken", response.data.token);
      document.cookie = `memberAuthToken=${response.data.token}; path=/`;
      
      // Clear session storage
      sessionStorage.removeItem("memberLoginEmail");
      sessionStorage.removeItem("memberTempToken");
      sessionStorage.removeItem("memberName");

      if (response.data.needs_password_setup) {
        toast.success("OTP verified! Please set up your password.");
        sessionStorage.setItem("memberNeedsPasswordSetup", "true");
        navigate("/member/set-password");
      } else {
        toast.success(`Welcome, ${response.data.name}!`);
        navigate("/member/dashboard");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Invalid OTP. Please try again.";
      toast.error(errorMsg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      await axios.post(`${API_BASE_URL}/member/auth/login`, {
        email: email
      });
      toast.success("New OTP sent to your email");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Verify OTP</h1>
          <p className="text-gray-400 text-sm mb-1">Step 2 of 2: Enter verification code</p>
          <p className="text-gray-400">
            Code sent to <span className="text-blue-400">{email}</span>
          </p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
        >
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify()}
            disabled={isLoading || otp.join("").length !== 6}
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
              isLoading || otp.join("").length !== 6
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Verify & Login"
            )}
          </motion.button>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className={`inline-flex items-center text-sm ${
                resendCooldown > 0
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-blue-400 hover:text-blue-300"
              }`}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
            </button>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <Link to="/member/login" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default MemberVerifyOtp;
