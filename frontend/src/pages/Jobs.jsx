import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../utils/api";
import { BriefcaseIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon, LinkIcon, CalendarIcon } from "@heroicons/react/24/outline";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedType !== "All") params.append("type", selectedType);
        if (selectedLocation !== "All") params.append("location", selectedLocation);
        
        const url = `${API_BASE_URL}/job${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [selectedType, selectedLocation]);

  // Get unique types and locations
  const types = ["All", "Full-time", "Part-time", "Internship", "Contract", "Freelance"];
  const locations = ["All", ...new Set(jobs.map(job => job.location).filter(Boolean))];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 py-20 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 py-20 flex justify-center items-center">
        <div className="text-center p-8 bg-red-900/50 dark:bg-red-100/50 backdrop-blur-sm rounded-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-400 dark:text-red-600 mb-4">Error Loading Jobs</h2>
          <p className="text-gray-300 dark:text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 pt-20 pb-16">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <BriefcaseIcon className="h-12 w-12 text-cyan-400 dark:text-cyan-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 dark:from-cyan-600 dark:via-blue-600 dark:to-purple-600">
                Job Board
              </span>
            </h1>
          </div>
          <p className="text-lg text-gray-300 dark:text-gray-600 max-w-2xl mx-auto">
            Explore exciting career opportunities and internships
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 dark:text-gray-700">Job Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-800/50 dark:bg-white/50 border border-gray-700 dark:border-gray-300 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 dark:text-gray-700">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-800/50 dark:bg-white/50 border border-gray-700 dark:border-gray-300 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {locations.slice(0, 10).map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Jobs List */}
        <div className="max-w-5xl mx-auto space-y-6">
          {jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-400 dark:text-gray-500"
            >
              <BriefcaseIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No jobs found. Check back later!</p>
            </motion.div>
          ) : (
            jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-800/50 dark:bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 dark:border-gray-300/50 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-lg text-cyan-400 dark:text-cyan-600 font-medium">
                          {job.company}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-900/30 dark:bg-cyan-200/30 text-cyan-300 dark:text-cyan-700">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-300 dark:text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Posted: {formatDate(job.posted_date)}</span>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>Deadline: {formatDate(job.deadline)}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-300 dark:text-gray-700 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    {job.requirements && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1">Requirements:</p>
                        <p className="text-sm text-gray-300 dark:text-gray-600 line-clamp-2">
                          {job.requirements}
                        </p>
                      </div>
                    )}
                  </div>

                  {job.apply_link && (
                    <div className="md:flex-shrink-0">
                      <a
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
                      >
                        <LinkIcon className="h-5 w-5" />
                        Apply Now
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;

