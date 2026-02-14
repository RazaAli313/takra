import * as HeroIcons from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';
import Modal from '../../components/Modal';

// Create a lazy-loaded version of icons to reduce initial bundle size
const UserGroupIcon = HeroIcons.UserGroupIcon;
const CalendarIcon = HeroIcons.CalendarIcon;
const DocumentTextIcon = HeroIcons.DocumentTextIcon;
const EnvelopeIcon = HeroIcons.EnvelopeIcon;
const RocketLaunchIcon = HeroIcons.RocketLaunchIcon;
const ArrowPathIcon = HeroIcons.ArrowPathIcon;

const AdminDashboard = () => {
  // Memoize static data to prevent recreating on every render
  const stats = [
    { title: "Total Members", value: "24", icon: <UserGroupIcon className="h-8 w-8" />, change: "+5 from last month", link: "/fake/team" },
  //   { title: "Upcoming Events", value: "2", icon: <CalendarIcon className="h-8 w-8" />, change: "1 new this week", link: "/fake/events" },
  //   { title: "Blog Posts", value: "3", icon: <DocumentTextIcon className="h-8 w-8" />, change: "1 draft in progress", link: "/fake/blogs" },
  //   { title: "New Messages", value: "5", icon: <EnvelopeIcon className="h-8 w-8" />, change: "2 unread", link: "/fake/messages" },
  ];

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/metrics`, { withCredentials: true });
        if (!cancelled) setMetrics(res.data);
      } catch (err) {
        console.error('Failed to load metrics', err);
      }
    };

    // If admin token is present immediately, fetch at once; otherwise wait a short time then fetch once.
    const hasToken = Boolean(localStorage.getItem('adminAuthToken') || document.cookie.includes('adminAuthToken='));
    if (hasToken) {
      load();
    } else {
      const t = setTimeout(() => { load(); }, 250);
      return () => { cancelled = true; clearTimeout(t); };
    }

    return () => { cancelled = true };
  }, []);

  // const recentActivity = [
  //   { id: 1, action: "Updated About page", user: "Noor Fatima", time: "2 hours ago" },
  //   { id: 2, action: "Added new event: Tech War", user: "Shahzeb Ali", time: "1 day ago" },
  //   { id: 3, action: "Published blog post", user: "Fiza Haider", time: "2 days ago" },
  //   { id: 4, action: "Updated team information", user: "Abdul Basit", time: "3 days ago" },
  // ];

  const quickActions = [
    { title: "Add New Event", icon: <CalendarIcon className="h-6 w-6" />, link: "/fake/events", color: "from-sky-600 to-blue-600" },
    { title: "Create Blog Post", icon: <DocumentTextIcon className="h-6 w-6" />, link: "/fake/blogs", color: "from-sky-500 to-blue-600" },
    { title: "Update Team", icon: <UserGroupIcon className="h-6 w-6" />, link: "/fake/team", color: "from-blue-600 to-sky-500" },
    { title: "View Messages", icon: <EnvelopeIcon className="h-6 w-6" />, link: "/fake/messages", color: "from-sky-500 to-blue-500" },
  ];

  // Simplified animation variants for better performance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // modal state and helper
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const openDetail = (r) => {
    setModalData(r);
    setModalOpen(true);
  };

  const closeDetail = () => {
    setModalOpen(false);
    setModalData(null);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500">
            Admin Dashboard
          </span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Welcome back! Here's what's happening with Taakra today.
        </p>
      </motion.div>
      {/* Metrics cards (live) */}
      {metrics && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
              <p className="text-slate-600 text-sm">Total Registrations</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{metrics.total_registrations}</h3>
              <p className="text-sm text-slate-500 mt-2">Last 7 days: {metrics.registrations_last_7_days}</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
              <p className="text-slate-600 text-sm">Configured Positions</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{metrics.positions_count}</h3>
              <p className="text-sm text-slate-500 mt-2">Without picture: {metrics.registrations_without_picture}</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
              <p className="text-slate-600 text-sm">Recent Registrations</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{metrics.recent_registrations.length}</h3>
              <p className="text-sm text-slate-500 mt-2">Latest 5 applicants</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full">
              <p className="text-slate-600 text-sm">Trend (7 days)</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{metrics.daily_trend_last_7_days.reduce((s, d) => s + d.count, 0)}</h3>
              <p className="text-sm text-slate-500 mt-2">Total last 7 days</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Positions by count (simple bar chart) */}
      {metrics && metrics.registrations_by_position && metrics.registrations_by_position.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Registrations by Position</h2>
          <div className="space-y-3">
            {metrics.registrations_by_position.slice(0, 8).map((p, idx) => {
              const max = metrics.registrations_by_position[0]?.count || 1;
              const pct = Math.round((p.count / Math.max(1, max)) * 100);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-48 text-sm text-slate-600">{p.position}</div>
                  <div className="flex-1 bg-slate-100 rounded overflow-hidden h-6">
                    <div className="bg-gradient-to-r from-sky-500 to-blue-600 h-6" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm text-slate-600">{p.count}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Registrations list with quick actions */}
      {metrics && metrics.recent_registrations && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Recent Registrations</h2>
          <div className="space-y-2">
            {metrics.recent_registrations.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="font-medium text-slate-800">{r.name} <span className="text-slate-500 text-sm">• {r.position_applied || 'N/A'}</span></div>
                  <div className="text-sm text-slate-600">{r.email} • {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openDetail(r)} className="px-3 py-1 bg-sky-500 hover:bg-sky-600 rounded text-sm text-white">View</button>
                  <a href={`${API_BASE_URL}/registrations/export`} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 rounded text-sm text-white" target="_blank" rel="noreferrer">Export CSV</a>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Registration Detail Modal */}
      <Modal isOpen={modalOpen} onClose={closeDetail} title={modalData ? `Registration: ${modalData.name}` : 'Registration'}>
        {modalData ? (
          <div className="space-y-3">
            <div><strong>Name:</strong> {modalData.name}</div>
            <div><strong>Email:</strong> {modalData.email}</div>
            <div><strong>Position:</strong> {modalData.position_applied || 'N/A'}</div>
            <div><strong>Submitted:</strong> {new Date(modalData.created_at).toLocaleString()}</div>
            <div className="mt-3">
              <a href={`${API_BASE_URL}/registrations/export`} className="px-3 py-1 bg-green-600 rounded text-sm" target="_blank" rel="noreferrer">Export CSV</a>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Link to={stat.link} className="block">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:border-sky-200 transition-colors h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-slate-800">{stat.value}</h3>
                    <p className="text-sm text-slate-500 mt-2">{stat.change}</p>
                  </div>
                  <div className="p-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white">
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800">
          <RocketLaunchIcon className="h-5 w-5 mr-2 text-sky-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -3 }} // Reduced movement for better performance
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={action.link}
                className={`block bg-gradient-to-r ${action.color} rounded-lg p-4 shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.title}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2 text-blue-400" />
            Recent Activity
          </h2>
          <button className="text-sm text-gray-400 hover:text-white">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-start pb-4 border-b border-gray-700 last:border-0 last:pb-0"
            >
              <div className="bg-blue-500/10 p-2 rounded-lg mr-4">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 p-1 rounded-md">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-400">
                  by {activity.user} • {activity.time}
                </p>
              </div>
              <button className="text-gray-500 hover:text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div> */}

      {/* System Status */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Storage</span>
              <span className="text-sm font-medium text-blue-400">45% used</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Memory</span>
              <span className="text-sm font-medium text-green-400">28% used</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '28%' }}></div>
            </div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Last Backup</span>
              <span className="text-sm font-medium text-gray-400">2 hours ago</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </motion.div> */}
    </div>
  );
};

export default AdminDashboard;