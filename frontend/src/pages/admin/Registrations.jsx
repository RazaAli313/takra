import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { API_BASE_URL } from '../../utils/api';
// import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaGoogle, FaSearch, FaTimes, FaCopy, FaExternalLinkAlt, FaDownload, FaEnvelope, FaUser, FaCalendarAlt } from 'react-icons/fa';

const AdminRegistrations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;
  // show all fields in card view, no modal needed
  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const initials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '—';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  const positionBadgeClass = (pos) => {
    if (!pos) return 'bg-gray-700 text-gray-200';
    const key = pos.toLowerCase();
    if (key.includes('media') || key.includes('graphic') || key.includes('video')) return 'bg-pink-600 text-white';
    if (key.includes('event') || key.includes('logistics') || key.includes('decor')) return 'bg-green-600 text-white';
    if (key.includes('photograph') || key.includes('videographer')) return 'bg-indigo-600 text-white';
    return 'bg-blue-600 text-white';
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const headers = {
          'adminAuthToken': Cookies.get('adminAuthToken'),
          'masterAuthToken': Cookies.get('masterAuthToken')
        };
        const res = await axios.get(`${API_BASE_URL}/registrations/`, { headers });
        setItems(res.data || []);
      } catch (e) {
        console.error('Failed to load registrations', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    // no saved-sheet fetch: UI uses inline input for sync
  }, []);

  const downloadCSV = async () => {
    try {
      const headers = {
        'adminAuthToken': Cookies.get('adminAuthToken'),
        'masterAuthToken': Cookies.get('masterAuthToken')
      };
      const res = await axios.get(`${API_BASE_URL}/registrations/export`, { headers, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registrations.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV download failed', err);
      toast.error('Failed to download CSV');
    }
  };

  return (
    <div className="p-6">
      {/* Sticky header so buttons remain visible even if table is wide */}
      <div className="sticky top-4 z-30 bg-gray-900/60 backdrop-blur-sm rounded-md p-4 mb-4">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3">
          <h2 className="text-2xl font-bold">Team Registrations</h2>
          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            {/* <div className="flex items-center gap-2 bg-gray-900 px-2 py-1 rounded"> */}
              {/* <input
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="Google Sheet URL or ID (leave blank to use env)"
                className="text-sm bg-transparent text-gray-200 px-2 py-1 w-64 md:w-96 outline-none"
                aria-label="Google Sheet URL or ID"
              />
            </div> */}
            {/* <button onClick={async () => {
              try {
                const body = spreadsheetInput.trim() ? { spreadsheet_url: spreadsheetInput.trim() } : {};
                const headers = {
                  'adminAuthToken': Cookies.get('adminAuthToken'),
                  'masterAuthToken': Cookies.get('masterAuthToken')
                };
                await toast.promise(
                  axios.post(`${API_BASE_URL}/registrations/sync`, body, { headers }),
                  {
                    loading: 'Syncing to Google Sheets...',
                    success: 'Synced successfully',
                    error: 'Sync failed'
                  } */}
                {/* );
              } catch (e) {
                console.error('Sync failed', e);
              }
            }} className="px-4 py-2 bg-blue-600 rounded flex items-center gap-2"> <FaGoogle /> Sync</button> */}
            <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 rounded">Export CSV</button>
          </div>
        </div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="bg-gradient-to-r from-gray-800/70 to-gray-900/70 rounded-md border border-gray-700 p-3 mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, position..." className="w-full bg-gray-900 text-sm p-2 rounded pl-9" />
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            {search && <button onClick={() => setSearch('')} className="px-3 py-1 bg-gray-700 rounded text-sm flex items-center gap-2"><FaTimes/> Clear</button>}
            <div className="text-sm text-gray-300">Showing {items.length} registrations</div>
          </div>

          {/* Card list view: vertical, no horizontal overflow */}
          <div className="space-y-4">
            {(() => {
              const filtered = items.filter((it) => {
                if (!search) return true;
                const q = search.toLowerCase();
                return (it.name || '').toLowerCase().includes(q) || (it.email || '').toLowerCase().includes(q) || (it.position_applied || '').toLowerCase().includes(q) || (it.portfolio || '').toLowerCase().includes(q) || (it.linkedin || '').toLowerCase().includes(q) || (it.why_join || '').toLowerCase().includes(q);
              });
              const total = filtered.length;
              const pages = Math.max(1, Math.ceil(total / perPage));
              const start = (page - 1) * perPage;
              const paged = filtered.slice(start, start + perPage);
              return paged.map((it) => (
                <motion.div key={it.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-md border border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                      {it.picture_url ? (
                        <img src={it.picture_url} alt="pic" className="w-14 h-14 object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">{initials(it.name)}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{it.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${positionBadgeClass(it.position_applied)}`}>{it.position_applied || '—'}</span>
                            <span className="text-sm text-gray-400">{it.campus || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button title="Copy email" onClick={() => copyToClipboard(it.email || '')} className="text-gray-400 hover:text-white"><FaCopy/></button>
                          {it.picture_url && <a title="Open picture" href={it.picture_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white"><FaExternalLinkAlt/></a>}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="md:col-span-2">
                          <p className="text-gray-300"><FaEnvelope className="inline mr-2 text-gray-400"/> {it.email}</p>
                          <p className="text-gray-300"><FaUser className="inline mr-2 text-gray-400"/> Roll No: {it.roll_no || '—'}</p>
                          <p className="text-gray-300"><FaCalendarAlt className="inline mr-2 text-gray-400"/> {it.created_at ? new Date(it.created_at).toLocaleString() : '—'}</p>
                        </div>
                        <div className="md:col-span-1 text-sm">
                          <p className="text-gray-300">Portfolio: {it.portfolio ? (<a className="text-blue-300 break-words" href={it.portfolio} target="_blank" rel="noreferrer">link <FaExternalLinkAlt className="inline ml-1 text-xs"/></a>) : '—'}</p>
                          <p className="text-gray-300">LinkedIn: {it.linkedin ? (<a className="text-blue-300 break-words" href={it.linkedin} target="_blank" rel="noreferrer">profile <FaExternalLinkAlt className="inline ml-1 text-xs"/></a>) : '—'}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-300">Why join</h4>
                          <p className="text-gray-200 whitespace-pre-wrap">{it.why_join || '—'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-300">Expertise / Best & Improve</h4>
                          <p className="text-gray-200 whitespace-pre-wrap"><strong>Expertise:</strong> {it.expertise || '—'}</p>
                          <p className="text-gray-200 whitespace-pre-wrap"><strong>Best thing:</strong> {it.best_thing || '—'}</p>
                          <p className="text-gray-200 whitespace-pre-wrap"><strong>Improve:</strong> {it.improve || '—'}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <h4 className="font-medium text-gray-300">Experience alignment</h4>
                        <p className="text-gray-200 whitespace-pre-wrap">{it.experience_alignment || '—'}</p>
                        <h4 className="font-medium text-gray-300 mt-2">Other society</h4>
                        <p className="text-gray-200 whitespace-pre-wrap">{it.other_society || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ));
            })()}
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-300">Page {page}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-700 rounded">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-700 rounded">Next</button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default AdminRegistrations;
