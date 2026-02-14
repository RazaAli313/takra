import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../utils/api';

const AdminDelegations = () => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openState, setOpenState] = useState(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/delegations`, { withCredentials: true });
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch delegations', err);
      toast.error('Failed to load delegations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); loadOpen(); }, []);

  const loadOpen = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/delegations/status`, { withCredentials: true });
      setOpenState(Boolean(res.data.open));
    } catch (err) {
      console.warn('Failed to load delegation status', err);
      setOpenState(null);
    }
  };

  const toggleOpen = async () => {
    try {
      const newState = !openState;
      const res = await axios.post(`${API_BASE_URL}/admin/delegations/status`, { open: newState }, { withCredentials: true });
      setOpenState(Boolean(res.data.open));
      toast.success(`Delegation form ${res.data.open ? 'opened' : 'closed'}`);
    } catch (err) { console.error(err); toast.error('Failed to update status'); }
  };

  const viewItem = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/delegations/${id}`, { withCredentials: true });
      setSelected(res.data);
      setPreviewUrl(null);
    } catch (err) { console.error(err); toast.error('Failed to load'); }
  };

  const deleteDelegation = (id) => {
    if (!id) return;
    // Show a toast with confirm/cancel buttons instead of native confirm dialog
    toast((t) => (
      <div className="text-sm text-white">
        <div>Delete this submission? This action cannot be undone.</div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await axios.delete(`${API_BASE_URL}/admin/delegations/${id}`, { withCredentials: true });
                toast.success('Deleted submission');
                if (selected && selected.id === id) setSelected(null);
                fetchList();
              } catch (err) {
                console.error('Delete failed', err);
                toast.error('Failed to delete submission');
              }
            }}
            className="px-3 py-1 bg-red-600 rounded text-xs"
          >
            Confirm
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-700 rounded text-xs">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const openPreview = (id) => {
    if (!id) return;
    // Use admin preview proxy endpoint so we avoid content-disposition download headers
    setPreviewUrl(`${API_BASE_URL}/admin/delegations/preview/${id}`);
  };

  const exportCsv = () => {
    // Use XHR to include credentials and avoid CORS/download issues.
    (async () => {
      try {
        const headers = {
          'adminAuthToken': Cookies.get('adminAuthToken'),
          'masterAuthToken': Cookies.get('masterAuthToken')
        };
        const res = await axios.get(`${API_BASE_URL}/admin/delegations/export`, { headers, responseType: 'blob', withCredentials: true });
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'delegations.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Export failed', err);
        toast.error('Failed to export CSV');
      }
    })();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Delegation Submissions</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="px-3 py-2 bg-blue-600 rounded">Export CSV</button>
          <button onClick={toggleOpen} className={`px-3 py-2 rounded ${openState ? 'bg-green-600' : 'bg-red-600'}`}>
            {openState === null ? 'Loading...' : (openState ? 'Open' : 'Closed')}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded border border-gray-700 overflow-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Campus</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} className="border-t border-gray-700">
                <td className="px-4 py-3">{it.name}</td>
                <td className="px-4 py-3">{it.email}</td>
                <td className="px-4 py-3">{it.phone}</td>
                <td className="px-4 py-3">{it.batch}</td>
                <td className="px-4 py-3">{it.campus}</td>
                <td className="px-4 py-3">{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => viewItem(it.id)} className="px-2 py-1 bg-teal-600 rounded">View</button>
                    <button onClick={() => deleteDelegation(it.id)} className="px-2 py-1 bg-red-600 rounded">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center p-6 z-50 overflow-auto">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Submission Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400">Close</button>
            </div>
            <div className="space-y-2 text-sm text-gray-200">
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>CNIC:</strong> {selected.cnic}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Phone:</strong> {selected.phone}</div>
              <div><strong>Batch:</strong> {selected.batch}</div>
              <div><strong>Campus:</strong> {selected.campus}</div>
              <div><strong>Why join:</strong><div className="mt-1 whitespace-pre-wrap text-gray-300">{selected.why_join}</div></div>
              <div><strong>Comments:</strong> {selected.comments || '-'}</div>
              <div>
                <strong>Resume:</strong>
                {' '}
                {selected.resume_url ? (
                  <>
                    <a className="text-blue-400 underline mr-2" href={selected.resume_url} target="_blank" rel="noreferrer">{selected.resume_filename || 'Open'}</a>
                    <button onClick={() => openPreview(selected.id)} className="px-2 py-1 bg-gray-700 rounded text-sm">Preview</button>
                  </>
                ) : 'No resume'}
              </div>
              <div><strong>Submitted:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => deleteDelegation(selected.id)} className="px-3 py-2 bg-red-600 rounded">Delete Submission</button>
              <button onClick={() => setSelected(null)} className="px-3 py-2 bg-gray-700 rounded">Close</button>
            </div>
            {previewUrl && (
              <div className="mt-4 bg-black bg-opacity-60 p-4 rounded">
                <div className="text-sm text-gray-300 mb-2">PDF Preview (scroll to view)</div>
                <div className="w-full h-[70vh]">
                  <iframe src={previewUrl} title="Resume Preview" className="w-full h-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDelegations;
