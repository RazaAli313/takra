import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../utils/api';
import { SearchIcon, FileTextIcon, DownloadIcon, EyeIcon, TrashIcon, MessageSquareIcon, XIcon, MailIcon } from 'lucide-react';

const AdminCogentLabsRegistrations = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openState, setOpenState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        window.location.href = '/manage/registrations/login';
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      const res = await axios.get(`${API_BASE_URL}/admin/registrations`, { headers, withCredentials: true });
      setItems(res.data || []);
      setFilteredItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/manage/registrations/login';
      } else {
        toast.error('Failed to load registrations');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); loadOpen(); }, []);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item => 
      item.name?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.batch?.toLowerCase().includes(query) ||
      item.campus?.toLowerCase().includes(query) ||
      item.feedback?.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const loadOpen = async () => {
    try {
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        setOpenState(null);
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      const res = await axios.get(`${API_BASE_URL}/admin/cogent-labs/registrations/status`, { headers, withCredentials: true });
      setOpenState(Boolean(res.data.open));
    } catch (err) {
      console.warn('Failed to load registration status', err);
      setOpenState(null);
    }
  };

  const toggleOpen = async () => {
    try {
      const newState = !openState;
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        toast.error('Not authenticated. Please login again.');
        window.location.href = '/manage/registrations/login';
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      const res = await axios.post(`${API_BASE_URL}/admin/cogent-labs/registrations/status`, { open: newState }, { headers, withCredentials: true });
      setOpenState(Boolean(res.data.open));
      toast.success(`Registration form ${res.data.open ? 'opened' : 'closed'}`);
    } catch (err) { 
      console.error('Toggle status error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/manage/registrations/login';
      } else {
        toast.error('Failed to update status');
      }
    }
  };

  const viewItem = async (id) => {
    try {
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        toast.error('Not authenticated. Please login again.');
        window.location.href = '/manage/registrations/login';
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      const res = await axios.get(`${API_BASE_URL}/admin/registrations/${id}`, { headers, withCredentials: true });
      setSelected(res.data);
      setFeedbackText(res.data.feedback || '');
      setPreviewUrl(null);
    } catch (err) { 
      console.error(err); 
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/manage/registrations/login';
      } else {
        toast.error('Failed to load');
      }
    }
  };

  const saveFeedback = async (id) => {
    if (!id) return;
    setSavingFeedback(true);
    try {
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        toast.error('Not authenticated. Please login again.');
        window.location.href = '/manage/registrations/login';
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      await axios.put(`${API_BASE_URL}/admin/registrations/${id}/feedback`, 
        { feedback: feedbackText },
        { headers, withCredentials: true }
      );
      toast.success('Feedback saved successfully');
      // Update local state
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, feedback: feedbackText } : item
      );
      setItems(updatedItems);
      if (selected && selected.id === id) {
        setSelected({ ...selected, feedback: feedbackText });
      }
    } catch (err) {
      console.error('Failed to save feedback', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/manage/registrations/login';
      } else {
        toast.error('Failed to save feedback');
      }
    } finally {
      setSavingFeedback(false);
    }
  };

  const sendFeedback = async (id) => {
    if (!id) return;
    
    // Check if feedback exists - use saved feedback from selected item or items list
    const savedFeedback = selected && selected.id === id ? (selected.feedback || '') : (items.find(item => item.id === id)?.feedback || '');
    if (!savedFeedback.trim()) {
      toast.error('Please save feedback before sending email');
      return;
    }
    
    setSendingFeedback(true);
    try {
      const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
      if (!token) {
        toast.error('Not authenticated. Please login again.');
        window.location.href = '/manage/registrations/login';
        return;
      }
      const headers = {
        'cogentLabsAuthToken': token
      };
      await axios.post(`${API_BASE_URL}/admin/registrations/${id}/send-feedback`, 
        {},
        { headers, withCredentials: true }
      );
      toast.success('Feedback email sent successfully!');
    } catch (err) {
      console.error('Failed to send feedback email', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/manage/registrations/login';
      } else if (err.response?.status === 400) {
        toast.error(err.response.data?.detail || 'Cannot send email. Please check feedback and email address.');
      } else {
        toast.error('Failed to send feedback email');
      }
    } finally {
      setSendingFeedback(false);
    }
  };

  const deleteRegistration = (id) => {
    if (!id) return;
    toast((t) => (
      <div className="text-sm text-white">
        <div>Delete this submission? This action cannot be undone.</div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
                if (!token) {
                  toast.error('Not authenticated. Please login again.');
                  window.location.href = '/manage/registrations/login';
                  return;
                }
                const headers = {
                  'cogentLabsAuthToken': token
                };
                await axios.delete(`${API_BASE_URL}/admin/registrations/${id}`, { headers, withCredentials: true });
                toast.success('Deleted submission');
                if (selected && selected.id === id) setSelected(null);
                fetchList();
              } catch (err) {
                console.error('Delete failed', err);
                if (err.response?.status === 401) {
                  toast.error('Session expired. Please login again.');
                  window.location.href = '/manage/registrations/login';
                } else {
                  toast.error('Failed to delete submission');
                }
              }
            }}
            className="px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
          >
            Confirm
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const openPreview = (id) => {
    if (!id) return;
    const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
    if (!token) {
      toast.error('Not authenticated. Please login again.');
      window.location.href = '/manage/registrations/login';
      return;
    }
    setPreviewUrl(`${API_BASE_URL}/admin/registrations/preview/${id}?token=${token}`);
  };

  const exportCsv = () => {
    (async () => {
      try {
        const token = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
        if (!token) {
          toast.error('Not authenticated. Please login again.');
          window.location.href = '/manage/registrations/login';
          return;
        }
        const headers = {
          'cogentLabsAuthToken': token
        };
        const res = await axios.get(`${API_BASE_URL}/admin/registrations/export`, { headers, responseType: 'blob', withCredentials: true });
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cogent_labs_registrations_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('CSV exported successfully');
      } catch (err) {
        console.error('Export failed', err);
        toast.error('Failed to export CSV');
      }
    })();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 pt-24 pb-6 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                Cogent Labs Mock Interview Registrations
              </h1>
              <p className="text-gray-400">Manage student registrations and provide HR feedback</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={exportCsv} 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <DownloadIcon className="h-4 w-4" />
                Export CSV
              </button>
              <button 
                onClick={toggleOpen} 
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-lg ${
                  openState 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                    : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                }`}
              >
                {openState === null ? 'Loading...' : (openState ? '✓ Open' : '✗ Closed')}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700 shadow-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, batch, campus, or feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-400">
              Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Registrations Table */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Campus</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Feedback</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      {searchQuery ? 'No results found' : 'No registrations yet'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(it => (
                    <tr key={it.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{it.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{it.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{it.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{it.batch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 capitalize">{it.campus}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {it.created_at ? new Date(it.created_at).toLocaleDateString() : ''}
                      </td>
                      <td className="px-6 py-4">
                        {it.feedback ? (
                          <div className="flex items-center gap-2">
                            <MessageSquareIcon className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm">Has feedback</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No feedback</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => viewItem(it.id)} 
                            className="p-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4 text-white" />
                          </button>
                          <button 
                            onClick={() => deleteRegistration(it.id)} 
                            className="p-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:from-red-700 hover:to-rose-700 transition-all"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-6 z-50 overflow-auto">
            <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-4xl border border-gray-700 shadow-2xl my-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                    Registration Details
                  </h3>
                  <p className="text-gray-400 text-sm">{selected.email}</p>
                </div>
                <button 
                  onClick={() => { setSelected(null); setPreviewUrl(null); }} 
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XIcon className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Name</label>
                    <p className="text-white font-medium mt-1">{selected.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">CNIC</label>
                    <p className="text-white mt-1">{selected.cnic}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Email</label>
                    <p className="text-white mt-1">{selected.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Phone</label>
                    <p className="text-white mt-1">{selected.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Batch</label>
                    <p className="text-white mt-1">{selected.batch}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Campus</label>
                    <p className="text-white mt-1 capitalize">{selected.campus}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Submitted</label>
                    <p className="text-white mt-1">{selected.created_at ? new Date(selected.created_at).toLocaleString() : ''}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider">Resume</label>
                    <div className="mt-1">
                      {selected.resume_url ? (
                        <div className="flex items-center gap-2">
                          <a 
                            className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1" 
                            href={selected.resume_url} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            <FileTextIcon className="h-4 w-4" />
                            {selected.resume_filename || 'View Resume'}
                          </a>
                          <button 
                            onClick={() => openPreview(selected.id)} 
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                          >
                            Preview
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">No resume uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Why Join</label>
                <div className="bg-gray-700/50 rounded-lg p-4 text-gray-300 whitespace-pre-wrap">
                  {selected.why_join}
                </div>
              </div>

              {selected.comments && (
                <div className="mb-6">
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Comments</label>
                  <div className="bg-gray-700/50 rounded-lg p-4 text-gray-300 whitespace-pre-wrap">
                    {selected.comments}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              <div className="mb-6 border-t border-gray-700 pt-6">
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-3 flex items-center gap-2">
                  <MessageSquareIcon className="h-4 w-4" />
                  HR Feedback (Mock Interview)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter feedback for this candidate's mock interview..."
                  rows={6}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => {
                      // Reset to the currently saved feedback value
                      setFeedbackText(selected.feedback || '');
                      toast.success('Feedback reset to saved value');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Reset to saved feedback"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => saveFeedback(selected.id)}
                    disabled={savingFeedback}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingFeedback ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <MessageSquareIcon className="h-4 w-4" />
                        Save Feedback
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => sendFeedback(selected.id)}
                    disabled={sendingFeedback || !(selected.feedback || feedbackText.trim())}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title={!(selected.feedback || feedbackText.trim()) ? 'Please save feedback before sending' : 'Send feedback email to student'}
                  >
                    {sendingFeedback ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <MailIcon className="h-4 w-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
                {selected.feedback && (
                  <div className="mt-4 bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                    <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Current Feedback</p>
                    <p className="text-green-200 whitespace-pre-wrap">{selected.feedback}</p>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="mt-6 bg-black/60 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-300">PDF Preview</p>
                    <button 
                      onClick={() => setPreviewUrl(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="w-full h-[70vh] rounded overflow-hidden">
                    <iframe 
                      src={previewUrl} 
                      title="Resume Preview" 
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3 pt-6 border-t border-gray-700">
                <button 
                  onClick={() => deleteRegistration(selected.id)} 
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg transition-all flex items-center gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Submission
                </button>
                <button 
                  onClick={() => { setSelected(null); setPreviewUrl(null); }} 
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCogentLabsRegistrations;
