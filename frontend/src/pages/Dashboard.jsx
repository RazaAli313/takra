import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarIcon, EnvelopeIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../utils/api";
import axios from "axios";

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearched(true);
    setRegistrations([]);
    try {
      const res = await axios.get(`${API_BASE_URL}/user/registered-competitions`, {
        params: { email: trimmed },
      });
      setRegistrations(res.data?.registrations || []);
    } catch (e) {
      setRegistrations([]);
    } finally {
    setLoading(false);
    }
  };

  const statusIcon = (status) => {
    if (status === "approved") return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (status === "rejected") return <XCircleIcon className="h-5 w-5 text-red-500" />;
    return <ClockIcon className="h-5 w-5 text-amber-500" />;
  };

  const statusLabel = (status) => {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              My Dashboard
            </span>
          </h1>
          <p className="text-slate-600">
            View competitions you’ve registered for. Enter the email you used to register.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLookup}
          className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 mb-8"
        >
          <label className="block text-sm font-medium text-slate-600 mb-2">Email address</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? "Loading…" : "View my registrations"}
            </button>
          </div>
        </motion.form>

        {searched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {registrations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
                <p>No registrations found for this email.</p>
                <p className="text-sm mt-2">Register from the <Link to="/competitions" className="text-sky-600 hover:underline">Competitions</Link> page.</p>
              </div>
            ) : (
              registrations.map((reg) => (
                <div
                  key={`${reg.competition?.id}-${reg.team_name}-${reg.registered_at}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-sky-100 hover:border-sky-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800">
                        {reg.competition?.title || "Competition"}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Team: <span className="font-medium text-slate-700">{reg.team_name}</span>
                      </p>
                      {reg.modules?.length > 0 && (
                        <p className="text-slate-500 text-sm">
                          Modules: {reg.modules.join(", ")}
                        </p>
                      )}
                      {reg.registered_at && (
                        <p className="flex items-center gap-1 text-slate-400 text-xs mt-2">
                          <CalendarIcon className="h-4 w-4" />
                          Registered {new Date(reg.registered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusIcon(reg.payment_status)}
                      <span className="text-sm font-medium text-slate-600">
                        {statusLabel(reg.payment_status)}
                      </span>
                    </div>
                  </div>
                  {reg.competition?.id && (
                    <Link
                      to={`/competitions/${reg.competition.id}`}
                      className="inline-block mt-3 text-sky-600 text-sm font-medium hover:underline"
                    >
                      View competition details →
                    </Link>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
