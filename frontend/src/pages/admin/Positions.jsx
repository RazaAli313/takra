import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/api';

const AdminPositions = () => {
  const [positions, setPositions] = useState([]);
  const [newPosition, setNewPosition] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/positions`, { withCredentials: true });
        setPositions(res.data.positions || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load positions');
      }
    };
    load();
  }, []);

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

  const deletePosition = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/admin/positions/${id}`, { withCredentials: true });
      if (res.data && res.data.in_use) {
        const c = res.data.count || 0;
        const ok = confirm(`There are ${c} applications that reference this position. Delete anyway?`);
        if (!ok) return;
        await axios.delete(`${API_BASE_URL}/admin/positions/${id}?force=true`, { withCredentials: true });
        setPositions(prev => prev.filter(p => p.id !== id));
        toast.success('Deleted');
        return;
      }
      setPositions(prev => prev.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Manage Positions</h2>
      <form onSubmit={createPosition} className="flex gap-2 mb-4 max-w-xl">
        <input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="New position name" className="flex-1 px-3 py-2 bg-gray-800 rounded border border-gray-700" />
        <button type="submit" className="px-3 py-2 bg-green-600 rounded">Add</button>
      </form>

      <ul className="space-y-2 max-w-xl">
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
  );
};

export default AdminPositions;
