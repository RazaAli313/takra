import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const MemberForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/member/auth/forgot-password`, {
        email: email.toLowerCase().trim()
      });
      
      setEmailSent(true);
      toast.success("Password reset link sent!");
    } catch (err) {
      // Don't reveal if email exists or not for security
      setEmailSent(true);
      toast.success("If the email is registered, a reset link has been sent.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-6">
            <CheckCircleIcon className="h-10 w-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">Check Your Email</h1>
          <p className="text-gray-400 mb-6">
            If an account exists for <span className="text-blue-400">{email}</span>, 
            we've sent a password reset link. Please check your inbox and spam folder.
          </p>
          
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg mb-6"
          >
            <p className="text-gray-400 text-sm mb-4">Didn't receive the email?</p>
            <ul className="text-left text-gray-400 text-sm space-y-2">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure the email is registered with your profile</li>
              <li>• Contact admin if you still have issues</li>
            </ul>
          </motion.div>
          
          <div className="space-x-4">
            <button
              onClick={() => setEmailSent(false)}
              className="text-blue-400 hover:text-blue-300"
            >
              Try another email
            </button>
            <span className="text-gray-600">|</span>
            <Link to="/member/login" className="text-gray-400 hover:text-gray-300">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Forgot Password
          </h1>
          <p className="text-gray-400">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>
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

export default MemberForgotPassword;
