import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import Cookies from "js-cookie";

const ADMIN_API = `${API_BASE_URL}/admin`;

const getAuthHeaders = () => {
  const token = Cookies.get("adminAuthToken");
  return token ? { adminAuthToken: token } : {};
};

const AdminSupportMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "support",
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${ADMIN_API}/support-members`, {
        headers: getAuthHeaders(),
      });
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error("Failed to load support members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("email", formData.email.trim().toLowerCase());
      payload.append("role", formData.role || "support");

      await axios.post(`${ADMIN_API}/support-members`, payload, {
        headers: getAuthHeaders(),
      });
      toast.success("Support member added");
      setFormData({ name: "", email: "", role: "support" });
      setShowForm(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add member");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this support member?")) return;
    try {
      await axios.delete(`${ADMIN_API}/support-members/${id}`, {
        headers: getAuthHeaders(),
      });
      toast.success("Support member removed");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to remove");
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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
            Support Members
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Add and manage support members (admin-only). These members can assist with competitions and registrations.
        </p>
      </motion.div>

      <motion.div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-white font-medium"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          {showForm ? "Cancel" : "Add Support Member"}
        </motion.button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h2 className="text-xl font-bold text-white mb-4">New Support Member</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="support">Support</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-white font-medium"
            >
              Add Member
            </button>
          </form>
        </motion.div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Current Support Members</h2>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <p className="text-gray-400">No support members yet. Add one above.</p>
        ) : (
          <div className="grid gap-4">
            {members.map((m) => (
              <motion.div
                key={m.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="h-10 w-10 text-amber-400" />
                  <div>
                    <span className="font-medium text-white">{m.name}</span>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <EnvelopeIcon className="h-4 w-4" />
                      {m.email}
                    </p>
                    {m.role && (
                      <span className="text-xs text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded">
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                  title="Remove"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportMembers;
