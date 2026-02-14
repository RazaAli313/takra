import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  UserPlusIcon,
  TrashIcon,
  EnvelopeIcon,
  UserCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import Cookies from "js-cookie";

const ADMIN_API = `${API_BASE_URL}/admin`;

const getAuthHeaders = () => {
  const token = Cookies.get("adminAuthToken");
  return token ? { adminAuthToken: token } : {};
};

const PERMISSION_LABELS = {
  dashboard: "Dashboard",
  home: "Home",
  about: "About",
  contact: "Contact",
  events: "Events",
  categories: "Categories",
  support_members: "Support Members",
  team: "Team",
  hall_of_fame: "Hall of Fame",
  blogs: "Blogs",
  faq: "FAQ",
  jobs: "Jobs",
  registrations: "Team Registrations",
  messages: "Messages",
  delegations: "Delegations",
  settings: "Settings",
};

const AdminSupportMembers = () => {
  const [members, setMembers] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "support",
    permissions: [],
  });
  const [editForm, setEditForm] = useState({ name: "", email: "", permissions: [] });

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${ADMIN_API}/support-members/permissions`, {
        headers: getAuthHeaders(),
      });
      setAllPermissions(res.data?.permissions || []);
    } catch {
      setAllPermissions([]);
    }
  };

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
    fetchPermissions();
  }, []);

  const togglePermission = (key, list, setter) => {
    if (list.includes(key)) setter(list.filter((p) => p !== key));
    else setter([...list, key]);
  };

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
      if (formData.permissions?.length) {
        payload.append("permissions", formData.permissions.join(","));
      }
      if (typeof window !== "undefined" && window.location?.origin) {
        payload.append("login_base_url", window.location.origin);
      }

      await axios.post(`${ADMIN_API}/support-members`, payload, {
        headers: getAuthHeaders(),
      });
      toast.success("Support member added. They will receive an email with login link and auto-generated password.");
      setFormData({ name: "", email: "", role: "support", permissions: [] });
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

  const openEdit = (m) => {
    setEditingMember(m);
    setEditForm({
      name: m.name || "",
      email: m.email || "",
      permissions: m.permissions || [],
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMember?.id) return;
    try {
      const payload = new FormData();
      payload.append("name", editForm.name.trim());
      payload.append("email", editForm.email.trim().toLowerCase());
      if (editForm.permissions?.length) payload.append("permissions", editForm.permissions.join(","));
      await axios.put(`${ADMIN_API}/support-members/${editingMember.id}`, payload, {
        headers: getAuthHeaders(),
      });
      toast.success("Support member updated.");
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update");
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
          Add support members as admins and choose which sections they can access. They receive an invitation email with an auto-generated password and can log in to see only the permitted sections.
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
          <h2 className="text-xl font-bold text-white mb-4">New Support Member (Admin)</h2>
          <p className="text-gray-400 text-sm mb-4">Select which admin sections this person can access. They will receive an email with a login link and generated password.</p>
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
              <label className="block text-gray-400 mb-2">Permissions (admin sections they can access)</label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                {allPermissions.map((key) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(key)}
                      onChange={() => togglePermission(key, formData.permissions, (next) => setFormData({ ...formData, permissions: next }))}
                      className="rounded border-gray-500 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-300">{PERMISSION_LABELS[key] || key}</span>
                  </label>
                ))}
              </div>
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
                  <UserCircleIcon className="h-10 w-10 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-white">{m.name}</span>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                      <EnvelopeIcon className="h-4 w-4 shrink-0" />
                      {m.email}
                    </p>
                    {(m.permissions || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(m.permissions || []).slice(0, 5).map((p) => (
                          <span key={p} className="text-xs text-amber-200 bg-amber-900/50 px-1.5 py-0.5 rounded">
                            {PERMISSION_LABELS[p] || p}
                          </span>
                        ))}
                        {(m.permissions || []).length > 5 && (
                          <span className="text-xs text-gray-400">+{m.permissions.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-2 text-gray-400 hover:text-amber-400 rounded-lg"
                    title="Edit permissions"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                    title="Remove"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {editingMember && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-white mb-4">Edit Support Member</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  {allPermissions.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.includes(key)}
                        onChange={() => togglePermission(key, editForm.permissions, (next) => setEditForm({ ...editForm, permissions: next }))}
                        className="rounded border-gray-500 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-300">{PERMISSION_LABELS[key] || key}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-gray-600 rounded-lg text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg text-white font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportMembers;
