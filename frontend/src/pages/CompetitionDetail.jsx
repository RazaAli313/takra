import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
  TrophyIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../utils/api";
import axios from "axios";

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE_URL}/competitions/${id}`);
        setCompetition(res.data);
      } catch (e) {
        setError(e.response?.data?.detail || "Competition not found");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center pt-24">
        <div className="rounded-full h-12 w-12 border-2 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center pt-24">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Competition not found</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/competitions")}
            className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate("/competitions")}
          className="flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Competitions
        </motion.button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {competition.image_url && (
            <div className="h-64 md:h-80 overflow-hidden">
              <img
                src={competition.image_url}
                alt={competition.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-8">
            {competition.category_name && (
              <span className="inline-block text-sm font-medium text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-4">
                {competition.category_name}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">{competition.title}</h1>
            <p className="text-lg text-slate-600 mb-6">{competition.description}</p>

            <div className="flex flex-wrap gap-4 text-slate-600 mb-6">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-sky-500" />
                {competition.date}
              </span>
              <span className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-sky-500" />
                {competition.time || "—"}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-sky-500" />
                {competition.location || "—"}
              </span>
              <span className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-sky-500" />
                {competition.registration_count ?? 0} registered
              </span>
            </div>

            {competition.deadline && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="text-amber-800">
                  <strong>Registration deadline:</strong> {competition.deadline}
                </span>
              </div>
            )}

            {competition.rules && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="h-6 w-6 text-sky-500" />
                  Rules
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line">
                  {competition.rules}
                </div>
              </section>
            )}

            {competition.prizes && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <TrophyIcon className="h-6 w-6 text-sky-500" />
                  Prizes
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line">
                  {competition.prizes}
                </div>
              </section>
            )}

            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
              {competition.registration_open ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/events?register=${competition.id}`)}
                  className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all"
                >
                  Register for this competition
                </motion.button>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-500 rounded-xl font-medium">
                  <XMarkIcon className="h-5 w-5" />
                  Registrations closed
                </span>
              )}
              <button
                onClick={() => navigate("/competitions")}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-sky-50 hover:border-sky-200 transition-colors"
              >
                View all competitions
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default CompetitionDetail;
