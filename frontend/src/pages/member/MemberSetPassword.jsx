import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const MemberSetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user needs password setup
    const needsSetup = sessionStorage.getItem("memberNeedsPasswordSetup");
    const token = localStorage.getItem("memberAuthToken") || Cookies.get("memberAuthToken");
    
    if (!needsSetup || !token) {
      toast.error("Please login first");
      navigate("/member/login");
    }
  }, [navigate]);

  // Password strength checker
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("memberAuthToken") || Cookies.get("memberAuthToken");
      
      // Get email from token verification
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/member/auth/verify`,
        {},
        {
          headers: { memberAuthToken: token }
        }
      );

      await axios.post(
        `${API_BASE_URL}/member/auth/set-password`,
        {
          email: verifyResponse.data.email,
          password: password
        },
        {
          headers: { memberAuthToken: token }
        }
      );

      sessionStorage.removeItem("memberNeedsPasswordSetup");
      toast.success("Password set successfully!");
      navigate("/member/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to set password. Please try again.";
      toast.error(errorMsg);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <LockClosedIcon className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">Set Your Password</h1>
          <p className="text-gray-400">
            Create a password for quick access to your portal
          </p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 mb-2">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
              
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.score <= 2 ? "text-red-400" :
                    passwordStrength.score <= 4 ? "text-yellow-400" : "text-green-400"
                  }`}>
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-400 text-xs mt-1 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Password requirements */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Password must:</p>
              <ul className="text-xs space-y-1">
                <li className={password.length >= 8 ? "text-green-400" : "text-gray-500"}>
                  • Be at least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? "text-green-400" : "text-gray-500"}>
                  • Include an uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? "text-green-400" : "text-gray-500"}>
                  • Include a lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? "text-green-400" : "text-gray-500"}>
                  • Include a number
                </li>
              </ul>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center ${
                isLoading || password !== confirmPassword || password.length < 8
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
                  Setting Password...
                </>
              ) : (
                "Set Password"
              )}
            </motion.button>
          </form>
        </motion.div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem("memberNeedsPasswordSetup");
              navigate("/member/dashboard");
            }}
            className="text-gray-500 hover:text-gray-400 text-sm"
          >
            Skip for now →
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MemberSetPassword;
