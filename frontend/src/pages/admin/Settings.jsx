import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from '../../utils/api';

const AdminSettings = () => {
  
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [newPosition, setNewPosition] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [lastLogin, setLastLogin] = useState(null);
  const [registrationsOpen, setRegistrationsOpen] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/positions`, { withCredentials: true });
        setPositions(res.data.positions || []);
      } catch (err) {
        console.error('Failed to load positions', err);
      }
    };
    load();
    // read last login timestamp from localStorage (set by Login.jsx)
    try {
      const v = localStorage.getItem('adminLastLogin');
      if (v) setLastLogin(v);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/registrations/status`, { withCredentials: true });
        setRegistrationsOpen(Boolean(res.data.open));
        setIsAdminUser(true);
      } catch (err) {
        // If admin call fails due to auth, fall back to the public status so UI still shows state
        console.warn('Admin status check failed, falling back to public status', err?.response?.status);
        try {
          const pres = await axios.get(`${API_BASE_URL}/registrations/status`);
          setRegistrationsOpen(Boolean(pres.data.open));
          setIsAdminUser(false);
        } catch (e) {
          console.error('Failed to load public registrations status', e);
          setRegistrationsOpen(null);
          setIsAdminUser(false);
        }
      }
    };
    loadStatus();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!password || !password.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsLoading(true);
    try {
      // Get auth token from cookies or localStorage
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      await axios.post(
        `${API_BASE_URL}/admin/set-password`,
        { password },
        { 
          withCredentials: true,
          headers
        }
      );
      toast.success("Password updated successfully!");
      setPassword("");
    } catch (err) {
      console.error('Password update error:', err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to update password";
      if (err.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createPosition = async (e) => {
    e.preventDefault();
    if (!newPosition.trim()) return toast.error('Enter a position name');
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/positions`, { name: newPosition.trim() }, { withCredentials: true });
      setPositions(prev => [{ id: res.data.id, name: res.data.name }, ...prev]);
      setNewPosition('');
      toast.success('Position added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add position');
    }
  };

  const startEdit = (p) => { setEditingId(p.id); setEditingName(p.name); };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/admin/positions/${editingId}`, { name: editingName }, { withCredentials: true });
      setPositions(prev => prev.map(x => x.id === editingId ? { ...x, name: editingName } : x));
      setEditingId(null); setEditingName('');
      toast.success('Position updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update');
    }
  };

  const toggleRegistrations = async () => {
    try {
      const newState = !registrationsOpen;
      const res = await axios.post(`${API_BASE_URL}/admin/registrations/status`, { open: newState }, { withCredentials: true });
      setRegistrationsOpen(Boolean(res.data.open));
      toast.success(`Registrations ${res.data.open ? 'opened' : 'closed'}`);
    } catch (err) {
      console.error('Failed to update registrations status', err);
      toast.error('Failed to update registrations status');
    }
  };

  const deletePosition = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/positions/${id}`, { withCredentials: true });
      if (res.data && res.data.in_use) {
        const c = res.data.count || 0;
        const ok = confirm(`There are ${c} applications that reference this position. Delete anyway?`);
        if (!ok) return;
        // force delete
        await axios.delete(`${API_BASE_URL}/admin/positions/${id}?force=true`, { withCredentials: true });
        setPositions(prev => prev.filter(p => p.id !== id));
        toast.success('Deleted');
        return;
      }
      // normal delete succeeded
      setPositions(prev => prev.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>
        <p className="text-sm text-gray-400 ml-4">Last login: {lastLogin ? formatDate(lastLogin) : 'Never'}</p>
      </div>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        <label className="block text-gray-400">New Admin Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {isLoading ? "Updating..." : "Set Password"}
        </button>
      </form>
      <div className="mt-8 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Manage Open Positions</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-400">Registrations</div>
            <div className="flex items-center gap-2">
              <button
                onClick={isAdminUser ? toggleRegistrations : undefined}
                disabled={!isAdminUser}
                className={`px-3 py-1 rounded ${registrationsOpen ? 'bg-green-600' : 'bg-red-600'} ${!isAdminUser ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {registrationsOpen ? 'Open' : (registrationsOpen === null ? 'Loading...' : 'Closed')}
              </button>
              {!isAdminUser && (
                <div className="text-xs text-gray-400">Sign in as admin to change</div>
              )}
            </div>
          </div>
        </div>
        <form onSubmit={createPosition} className="flex gap-2 mb-4">
          <input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="New position name" className="flex-1 px-3 py-2 bg-gray-800 rounded border border-gray-700" />
          <button type="submit" className="px-3 py-2 bg-green-600 rounded">Add</button>
        </form>

        <ul className="space-y-2">
          {positions.map(p => (
            <li key={p.id} className="p-3 bg-gray-800 rounded flex items-center justify-between">
              {editingId === p.id ? (
                <form onSubmit={saveEdit} className="flex gap-2 w-full">
                  <input className="flex-1 px-2 py-1 bg-gray-900 rounded border border-gray-700" value={editingName} onChange={e => setEditingName(e.target.value)} />
                  <button className="px-3 py-1 bg-blue-600 rounded">Save</button>
                  <button type="button" onClick={() => { setEditingId(null); setEditingName(''); }} className="px-3 py-1 bg-gray-600 rounded">Cancel</button>
                </form>
              ) : (
                <>
                  <span className="text-sm">{p.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="px-2 py-1 bg-yellow-600 rounded text-sm">Edit</button>
                    <button onClick={() => deletePosition(p.id)} className="px-2 py-1 bg-red-600 rounded text-sm">Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;
