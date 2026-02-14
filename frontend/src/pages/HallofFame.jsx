import { motion } from "framer-motion";
import { TrophyIcon, StarIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const HallOfFame = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const iconComponents = {
    TrophyIcon: <TrophyIcon className="h-8 w-8 text-sky-500" />,
    StarIcon: <StarIcon className="h-8 w-8 text-sky-500" />,
    AcademicCapIcon: <AcademicCapIcon className="h-8 w-8 text-sky-500" />
  };

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
  const response = await axios.get(`${API_BASE_URL}/achievements`);
        setAchievements(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load achievements. Please try again later.");
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg border border-slate-200 shadow-lg max-w-md">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Hall of Fame
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            Celebrating our milestones and achievements that make us proud.
          </p>
        </motion.div>

        {achievements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-xl">No achievements to display yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(achievements) && achievements.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-xl p-6 border border-slate-200 shadow-lg hover:shadow-sky-50 hover:border-sky-200 transition-all"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-sky-100 mr-4">
                    {iconComponents[item.icon]}
                  </div>
                  <span className="text-xl font-bold text-sky-600">
                    {[item.month || "", item.year || ""].filter(Boolean).join(" ").trim() || "—"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
                {item.image_url && (
                  <div className="mb-2">
                    <img src={item.image_url} alt={item.title} className="w-full max-h-64 object-cover rounded mx-auto" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HallOfFame;