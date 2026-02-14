import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarIcon, ClockIcon, MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../utils/api";
import axios from "axios";

const CompetitionsCalendar = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/competitions/calendar`, {
          params: { month },
        });
        setCompetitions(res.data?.competitions || []);
      } catch (e) {
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [month]);

  const monthLabel = month
    ? new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-24 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Calendar
            </span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            View competitions in agenda format. Pick a month to see what’s coming up.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto mb-8">
          <label className="block text-sm font-medium text-slate-600 mb-2">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="rounded-full h-12 w-12 border-2 border-sky-500 border-t-transparent animate-spin" />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No competitions scheduled for {monthLabel}.</p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
              hidden: {},
            }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            {competitions.map((comp) => (
              <motion.li
                key={comp.id}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <Link
                  to={`/competitions/${comp.id}`}
                  className="block bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-sky-100 hover:border-sky-200 transition-all"
                >
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 text-sm mb-2">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {comp.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {comp.time || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4" />
                      {comp.registration_count ?? 0} registered
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{comp.title}</h3>
                  {comp.location && (
                    <p className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      <MapPinIcon className="h-4 w-4" />
                      {comp.location}
                    </p>
                  )}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
};

export default CompetitionsCalendar;
