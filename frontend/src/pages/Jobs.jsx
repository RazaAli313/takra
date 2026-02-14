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

  const DUMMY_JOBS = [
    { id: 'dummy-1', title: 'Opportunities at Taakra', company: 'Taakra', type: 'Internship', location: 'Lahore', description: 'Roles will appear here when the server is available.', posted_at: new Date().toISOString() }
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedType !== "All") params.append("type", selectedType);
        if (selectedLocation !== "All") params.append("location", selectedLocation);
        const url = `${API_BASE_URL}/job${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : DUMMY_JOBS);
        setError(null);
      } catch (err) {
        setJobs(DUMMY_JOBS);
        setError(null);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-20 pb-16">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <BriefcaseIcon className="h-12 w-12 text-sky-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600">
                Job Board
              </span>
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
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
            <label className="block text-sm font-medium mb-2 text-slate-600">Job Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-600">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
              className="text-center py-12 text-slate-500"
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
                className="bg-white backdrop-blur-sm rounded-xl p-6 border border-slate-200 shadow-sm hover:border-sky-200 hover:shadow-sky-50 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">
                          {job.title}
                        </h3>
                        <p className="text-lg text-sky-600 font-medium">
                          {job.company}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4 text-sm text-slate-600">
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

                    <p className="text-slate-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    {job.requirements && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-500 mb-1">Requirements:</p>
                        <p className="text-sm text-slate-600 line-clamp-2">
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
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg font-semibold text-white hover:shadow-lg hover:shadow-sky-200 transition-all duration-300"
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

