import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from 'react-hot-toast';
import { API_BASE_URL } from "../../utils/api";
import { 
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  LockOpenIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RejectionReasonModal from "../../components/RejectionReasonModal";

const BlogSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, submissionId: null });
  const [registrationStatus, setRegistrationStatus] = useState({ open: true });
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Filter submissions
  useEffect(() => {
    let filtered = [...submissions];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.title?.toLowerCase().includes(query) ||
        sub.author?.toLowerCase().includes(query) ||
        sub.email?.toLowerCase().includes(query)
      );
    }

    setFilteredSubmissions(filtered);
  }, [statusFilter, searchQuery, submissions]);

  const handleApprove = async (submissionId) => {
    if (!confirm('Are you sure you want to approve this blog submission? It will be published immediately.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/approve`, {
        method: 'PUT'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve submission');
      }

      toast.success('Blog submission approved and published!');
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (err) {
      toast.error(err.message || 'Failed to approve submission');
    }
  };

  const handleRejectClick = (submissionId) => {
    setRejectionModal({ isOpen: true, submissionId });
  };

  const handleRejectConfirm = async (reason) => {
    const { submissionId } = rejectionModal;
    if (!submissionId) return;

    try {
      const formData = new FormData();
      if (reason) {
        formData.append('reason', reason);
      }

      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/reject`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reject submission');
      }

      toast.success('Blog submission rejected');
      await fetchSubmissions();
      setSelectedSubmission(null);
      setRejectionModal({ isOpen: false, submissionId: null });
    } catch (err) {
      toast.error(err.message || 'Failed to reject submission');
    }
  };

  const handleDelete = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete submission');
      }

      toast.success('Submission deleted successfully');
      await fetchSubmissions();
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete submission');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      approved: "bg-green-500/20 text-green-300 border-green-500/50",
      rejected: "bg-red-500/20 text-red-300 border-red-500/50"
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
            Blog Submissions
          </span>
        </h1>
        <p className="text-gray-400">Manage blog submissions from the community</p>
      </motion.div>

      {/* Registration Status Toggle */}
      <div className="flex justify-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRegistrationStatus}
          disabled={isTogglingStatus}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            registrationStatus.open
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {registrationStatus.open ? (
            <>
              <LockOpenIcon className="h-5 w-5" />
              Submissions Open
            </>
          ) : (
            <>
              <LockClosedIcon className="h-5 w-5" />
              Submissions Closed
            </>
          )}
        </motion.button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-teal-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Pending ({submissions.filter(s => s.status === "pending").length})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "approved"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Approved ({submissions.filter(s => s.status === "approved").length})
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "rejected"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Rejected ({submissions.filter(s => s.status === "rejected").length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by title, author, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubmissions.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-xl">No submissions found</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <motion.div
              key={submission.id}
              whileHover={{ y: -5 }}
              className="bg-gray-700 rounded-xl p-6 border border-gray-600 cursor-pointer"
              onClick={() => setSelectedSubmission(submission)}
            >
              {submission.image_url && (
                <div className="h-40 overflow-hidden mb-4 rounded-lg">
                  <img
                    src={submission.image_url}
                    alt={submission.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold line-clamp-2 flex-1">{submission.title}</h3>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-gray-300 mb-4 line-clamp-2">{submission.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {submission.author}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {submission.read_time}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-gray-500">
                <EnvelopeIcon className="h-3 w-3 mr-1" />
                {submission.email}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">{selectedSubmission.title}</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              {getStatusBadge(selectedSubmission.status)}
            </div>

            {selectedSubmission.image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={selectedSubmission.image_url}
                  alt={selectedSubmission.title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Author</label>
                <p className="text-white font-medium">{selectedSubmission.author}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white">{selectedSubmission.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Read Time</label>
                <p className="text-white">{selectedSubmission.read_time}</p>
              </div>
              {selectedSubmission.excerpt && (
                <div>
                  <label className="text-gray-400 text-sm">Excerpt</label>
                  <p className="text-white">{selectedSubmission.excerpt}</p>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-sm">Content</label>
                <div className="mt-2 prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedSubmission.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Submitted At</label>
                <p className="text-white">
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedSubmission.status === "pending" && (
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRejectClick(selectedSubmission.id)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium flex items-center"
                >
                  <XCircleIcon className="h-5 w-5 mr-2" />
                  Reject
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleApprove(selectedSubmission.id)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Approve & Publish
                </motion.button>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-700 mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDelete(selectedSubmission.id)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium flex items-center"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, submissionId: null })}
        onConfirm={handleRejectConfirm}
        title="Reject Blog Submission"
      />
    </div>
  );
};

export default BlogSubmissions;

