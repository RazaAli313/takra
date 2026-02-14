
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import Cookies from 'js-cookie';
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  // ...existing code...
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // Remove pre-fetching and hardcoded credentials
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // POST credentials to backend for verification
  const response = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
        email: formData.email,
        password: formData.password
      });
  // Store JWT token from backend in both localStorage and cookies
  localStorage.setItem("adminAuthToken", response.data.token);
  Cookies.set("adminAuthToken", response.data.token);
  // Record last login time for admin UI
  try {
    localStorage.setItem('adminLastLogin', new Date().toISOString());
  } catch (e) {
    // ignore storage errors
    console.warn('Could not store adminLastLogin', e);
  }
  navigate("/fake");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-950 via-slate-900 to-blue-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src="/takra.png" alt="Taakra" className="h-16 w-16 mx-auto mb-4 rounded-full border-2 border-sky-400/80 shadow-lg shadow-sky-500/20" />
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500">
            Taakra 2026 Admin
          </h1>
          <p className="text-slate-400">Sign in to manage your content</p>
        </div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-2xl bg-gradient-to-br from-sky-400/20 via-slate-800/95 to-blue-500/20 p-[2px] shadow-xl shadow-sky-500/10"
        >
          <div className="rounded-[14px] bg-slate-800/95 backdrop-blur border border-sky-500/30 p-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-slate-400 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-sky-400/80" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400/50"
                    placeholder="Username or Email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-slate-400 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-sky-400/80" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-700/80 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
                  isLoading
                    ? "bg-slate-600 cursor-not-allowed text-slate-400"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>For authorized personnel only</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;