import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { BriefcaseIcon, TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../../utils/api";

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    description: "",
    requirements: "",
    salary: "",
    apply_link: "",
    deadline: "",
    is_active: true
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/job/all`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      toast.error("Failed to load jobs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.title.trim() || !formData.company.trim() || !formData.location.trim() || !formData.description.trim()) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== "" && formData[key] !== null) {
          formDataToSend.append(key, formData[key].toString());
        }
      });

      const url = isEditMode && editingJob
        ? `${API_BASE_URL}/job/${editingJob.id}`
        : `${API_BASE_URL}/job`;
      
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} job`);
      }

      setSuccessMessage(`Job ${isEditMode ? 'updated' : 'posted'} successfully!`);
      resetForm();
      fetchJobs();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred");
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setIsEditMode(true);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      type: job.type || "Full-time",
      description: job.description || "",
      requirements: job.requirements || "",
      salary: job.salary || "",
      apply_link: job.apply_link || "",
      deadline: job.deadline || "",
      is_active: job.is_active !== undefined ? job.is_active : true
    });
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="mb-2">Are you sure you want to delete this job?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`${API_BASE_URL}/job/${id}`, {
                  method: "DELETE",
                });
                if (!response.ok) throw new Error("Failed to delete job");
                fetchJobs();
                toast.success("Job deleted successfully!");
              } catch (error) {
                toast.error(error.message || "Failed to delete job");
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      type: "Full-time",
      description: "",
      requirements: "",
      salary: "",
      apply_link: "",
      deadline: "",
      is_active: true
    });
    setIsEditMode(false);
    setEditingJob(null);
    setErrorMessage("");
  };

  const jobTypes = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 bg-opacity-70 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-8">
            <BriefcaseIcon className="h-8 w-8 text-blue-400" />
            <h2 className="text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
                Job Board Management
              </span>
            </h2>
          </div>

          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-900 bg-opacity-50 text-blue-300 rounded-lg border border-blue-700 flex items-center justify-between"
            >
              <div className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Editing Job</p>
              </div>
              <button
                onClick={resetForm}
                className="text-blue-300 hover:text-blue-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-900 bg-opacity-50 text-green-300 rounded-lg border border-green-700"
            >
              {successMessage}
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-900 bg-opacity-50 text-red-300 rounded-lg border border-red-700"
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Remote, Karachi, Lahore"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Job description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requirements
              </label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Required skills, qualifications, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Salary/Compensation
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., $50k - $70k, Competitive"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Application Link
              </label>
              <input
                type="url"
                value={formData.apply_link}
                onChange={(e) => setFormData({ ...formData, apply_link: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://company.com/apply"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-300">
                Active (visible on website)
              </label>
            </div>

            <div className="flex justify-end gap-3">
              {isEditMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : isEditMode ? "Update Job" : "Post Job"}
              </button>
            </div>
          </form>

          <div className="border-t border-gray-700 pt-8">
            <h3 className="text-2xl font-bold mb-6 text-blue-400">
              Existing Jobs ({jobs.length})
            </h3>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BriefcaseIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobs posted yet. Create one using the form above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-5 border ${
                      job.is_active ? 'border-blue-500/50' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            job.is_active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {job.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                            {job.type}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">{job.title}</h4>
                        <p className="text-cyan-400 font-medium mb-2">{job.company}</p>
                        <p className="text-gray-400 text-sm mb-2">{job.location}</p>
                        <p className="text-gray-300 text-sm line-clamp-2">{job.description}</p>
                        {job.salary && (
                          <p className="text-gray-400 text-sm mt-2">💰 {job.salary}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(job)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminJobs;

