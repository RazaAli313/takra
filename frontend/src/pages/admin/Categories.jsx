import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FolderIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import Cookies from "js-cookie";

const getAuthHeaders = () => {
  const token = Cookies.get("adminAuthToken");
  return token ? { adminAuthToken: token } : {};
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    order: 0,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", order: 0 });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      if (formData.slug.trim()) payload.append("slug", formData.slug.trim());
      if (formData.description) payload.append("description", formData.description);
      payload.append("order", String(formData.order));

      if (isEditing && editingId) {
        await axios.put(`${API_BASE_URL}/categories/${editingId}`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success("Category updated");
      } else {
        await axios.post(`${API_BASE_URL}/categories`, payload, {
          headers: getAuthHeaders(),
        });
        toast.success("Category created");
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      order: cat.order ?? 0,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? Events may still reference it.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Competition Categories
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Add and manage categories for competitions (e.g. Coding, AI, Design)
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-xl font-bold text-white mb-4">
          {isEditing ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g. Coding"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Slug (optional)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g. coding"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-medium"
            >
              {isEditing ? "Update" : "Add"} Category
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 rounded-lg text-white font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">All Categories</h2>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <p className="text-gray-400">No categories yet. Add one above.</p>
        ) : (
          <div className="grid gap-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FolderIcon className="h-5 w-5 text-cyan-400" />
                  <div>
                    <span className="font-medium text-white">{cat.name}</span>
                    {cat.slug && (
                      <span className="text-gray-400 text-sm ml-2">({cat.slug})</span>
                    )}
                    {cat.description && (
                      <p className="text-gray-400 text-sm mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 text-gray-400 hover:text-blue-400 rounded-lg"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
