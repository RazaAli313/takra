import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const MemberLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Verify password
      const response = await axios.post(`${API_BASE_URL}/member/auth/login-password`, {
        email: email.toLowerCase().trim(),
        password
      });
      
      // Store temporary token and email for OTP step
      sessionStorage.setItem("memberLoginEmail", email.toLowerCase().trim());
      sessionStorage.setItem("memberTempToken", response.data.token);
      sessionStorage.setItem("memberName", response.data.name);
      
      // Step 2: Request OTP
      await axios.post(`${API_BASE_URL}/member/auth/login`, {
        email: email.toLowerCase().trim()
      });
      
      toast.success("Password verified! OTP sent to your email.");
      navigate("/member/verify-otp");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Invalid credentials. Please try again.";
      
      // If password not set, redirect to OTP login for first-time setup
      if (errorMsg.includes("Password not set")) {
        sessionStorage.setItem("memberLoginEmail", email.toLowerCase().trim());
        try {
          await axios.post(`${API_BASE_URL}/member/auth/login`, {
            email: email.toLowerCase().trim()
          });
          toast.success("First time login! OTP sent to your email.");
          navigate("/member/verify-otp");
        } catch (otpErr) {
          toast.error(otpErr.response?.data?.detail || "Failed to send OTP");
        }
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
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
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            FDC-Member Portal
          </h1>
          <p className="text-gray-400">Sign in to update your portfolio</p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
        >
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">
              Step 1 of 2: Enter your credentials
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="your@email.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use the email registered by admin for your profile
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
                isLoading
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
                "Continue"
              )}
            </motion.button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/member/forgot-password"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Forgot your password?
            </Link>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default MemberLogin;
