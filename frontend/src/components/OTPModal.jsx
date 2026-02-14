import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { toast } from "react-hot-toast";

const OTPModal = ({ email, onVerified, onClose }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  // Send OTP when modal opens
  useState(() => {
    if (email) sendOTP();
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
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
  await axios.post(`${API_BASE_URL}/otp/generate`, { email });
      setSuccess("OTP sent to " + email);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value, idx) => {
    if (!/^[0-9]?$/.test(value)) return;
    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);
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
  await axios.post(`${API_BASE_URL}/otp/verify`, { email, otp: otpValue });
      setSuccess("OTP verified!");
      toast.success("OTP verified!");
      onVerified();
    } catch (err) {
      setError(err.response?.data?.detail || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Verify Email</h2>
        <p className="text-gray-300 mb-2">Enter the OTP sent to <span className="text-cyan-400">{email}</span></p>
        {error && <div className="mb-2 text-red-400">{error}</div>}
        {success && <div className="mb-2 text-green-400">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 justify-center mb-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                className="w-10 h-10 text-center text-xl bg-gray-700 border border-gray-600 rounded"
              />
            ))}
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-2 rounded bg-blue-600 text-white font-semibold">
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <div className="mt-4 flex justify-between items-center">
          <button onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
          <button onClick={sendOTP} disabled={resendTimer > 0 || isLoading} className="text-cyan-400 hover:text-cyan-300">
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
