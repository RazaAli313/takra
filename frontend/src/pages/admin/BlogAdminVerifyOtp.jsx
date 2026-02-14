import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from "../../utils/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const BlogAdminVerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Generate OTP on component mount
  useEffect(() => {
    generateOTP();
    
    // Set up interval for resend timer
    const timerInterval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timerInterval);
        return 0;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);

  const generateOTP = async () => {
    try {
      setError("");
      const token = Cookies.get('blogAdminAuthToken') || localStorage.getItem('blogAdminAuthToken');
      if (!token) {
        navigate('/manage/blogs/login');
        return;
      }
      // Call FastAPI endpoint to generate OTP
      const response = await axios.post(`${API_BASE_URL}/blogadmin/otp/generate`, {}, {
        headers: {
          'blogAdminAuthToken': token
        },
        withCredentials: true
      });
      setSuccess("OTP has been sent to contact@taakra2026.com");
      setResendTimer(60); // Reset timer for 60 seconds
      toast.success("OTP sent to email");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate OTP");
      toast.error(err.response?.data?.detail || "Failed to generate OTP");
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    
    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      // Focus previous input on backspace
      const prevInput = e.target.previousSibling;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const otpValue = parseInt(otp.join(''));
      
      if (isNaN(otpValue) || otpValue.toString().length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }
      
      const token = Cookies.get('blogAdminAuthToken') || localStorage.getItem('blogAdminAuthToken');
      if (!token) {
        navigate('/manage/blogs/login');
        return;
      }

      // Verify OTP with FastAPI backend
      const response = await axios.post(`${API_BASE_URL}/blogadmin/otp/verify`, {
        otp: otpValue
      }, {
        headers: {
          'blogAdminAuthToken': token
        },
        withCredentials: true
      });

      if (response.status === 200) {
        setSuccess("OTP verified successfully!");
        toast.success("OTP verified successfully!");
        // Set a secure cookie to indicate OTP verification
        Cookies.set("blogAdminOtpVerified", "true", { 
          path: "/", 
          expires: 1, // 1 day
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax'
        });
        setTimeout(() => {
          navigate("/manage/blogs");
        }, 1000);
      }
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError("Invalid or expired OTP. Please try again.");
        toast.error("Invalid or expired OTP");
      } else {
        setError(err.message || "OTP verification failed");
        toast.error(err.message || "OTP verification failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await generateOTP();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend OTP");
      toast.error(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
            Verify Your Identity
          </h1>
          <p className="text-gray-400">Enter the OTP sent to contact@taakra2026.com</p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
        >
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-green-500/10 text-green-400 rounded-lg border border-green-500/30 text-sm"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-gray-400 mb-4 text-center">
                Enter 6-digit verification code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="1"
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onFocus={e => e.target.select()}
                    className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-lg text-center text-white text-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || otp.some(digit => digit === "")}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
                isLoading || otp.some(digit => digit === "")
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-teal-600"
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
                "Verify OTP"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResendOTP}
              disabled={resendTimer > 0 || isLoading}
              className={`text-sm flex items-center justify-center mx-auto ${resendTimer > 0 || isLoading ? "text-gray-500" : "text-teal-400 hover:text-teal-300"}`}
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>
        </motion.div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>For security purposes, please verify your identity</p>
        </div>
      </motion.div>
    </div>
  );
};

export default BlogAdminVerifyOtp;

