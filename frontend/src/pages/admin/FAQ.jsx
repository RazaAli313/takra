import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { QuestionMarkCircleIcon, TrashIcon, PencilIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../../utils/api";

const AdminFAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
    order: 0,
    is_active: true
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/faq/all`);
      if (!response.ok) throw new Error('Failed to fetch FAQs');
      const data = await response.json();
      setFaqs(data);
    } catch (error) {
      toast.error("Failed to load FAQs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.question.trim() || !formData.answer.trim()) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("question", formData.question.trim());
      formDataToSend.append("answer", formData.answer.trim());
      formDataToSend.append("category", formData.category.trim());
      formDataToSend.append("order", formData.order.toString());
      formDataToSend.append("is_active", formData.is_active.toString());

      const url = isEditMode && editingFAQ
        ? `${API_BASE_URL}/faq/${editingFAQ.id}`
        : `${API_BASE_URL}/faq`;
      
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} FAQ`);
      }

      setSuccessMessage(`FAQ ${isEditMode ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchFAQs();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred");
    }
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    setIsEditMode(true);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "General",
      order: faq.order || 0,
      is_active: faq.is_active !== undefined ? faq.is_active : true
    });
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div>
        <p className="mb-2">Are you sure you want to delete this FAQ?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`${API_BASE_URL}/faq/${id}`, {
                  method: "DELETE",
                });
                if (!response.ok) throw new Error("Failed to delete FAQ");
                fetchFAQs();
                toast.success("FAQ deleted successfully!");
              } catch (error) {
                toast.error(error.message || "Failed to delete FAQ");
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
      question: "",
      answer: "",
      category: "General",
      order: 0,
      is_active: true
    });
    setIsEditMode(false);
    setEditingFAQ(null);
    setErrorMessage("");
  };

  const categories = ["General", "Membership", "Events", "Team", "Technical", "Other"];

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
            <QuestionMarkCircleIcon className="h-8 w-8 text-yellow-400" />
            <h2 className="text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                FAQ Management
              </span>
            </h2>
          </div>

          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-900 bg-opacity-50 text-yellow-300 rounded-lg border border-yellow-700 flex items-center justify-between"
            >
              <div className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Editing FAQ</p>
              </div>
              <button
                onClick={resetForm}
                className="text-yellow-300 hover:text-yellow-200 transition-colors"
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Question *
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter question"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Answer *
              </label>
              <textarea
                rows={6}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Enter answer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-600 rounded bg-gray-700"
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
                className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 text-white font-medium rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : isEditMode ? "Update FAQ" : "Create FAQ"}
              </button>
            </div>
          </form>

          <div className="border-t border-gray-700 pt-8">
            <h3 className="text-2xl font-bold mb-6 text-yellow-400">
              Existing FAQs ({faqs.length})
            </h3>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-500"></div>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No FAQs available. Create one using the form above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-5 border ${
                      faq.is_active ? 'border-yellow-500/50' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            faq.is_active ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {faq.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                          {faq.category && (
                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                              {faq.category}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">Order: {faq.order}</span>
                        </div>
                        <h4 className="text-lg font-bold mb-2">{faq.question}</h4>
                        <p className="text-gray-300 text-sm line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
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

export default AdminFAQ;

