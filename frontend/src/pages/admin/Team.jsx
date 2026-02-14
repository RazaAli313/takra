import { API_BASE_URL } from "../../utils/api";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  BellAlertIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// const API_BASE_URL = "http://localhost:8000/api";

const AdminTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [availableTenures, setAvailableTenures] = useState([]);
  
  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    subject: "",
    message: "",
    include_portal_link: true,
    member_type: "all"
  });
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [membersWithEmail, setMembersWithEmail] = useState([]);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [isSendingNotify, setIsSendingNotify] = useState(false);

  // Group team members by tenure (support multiple tenures per member)
  const groupByTenure = (members) => {
    const grouped = {};
    members.forEach(member => {
      // Support both old format (string) and new format (array)
      const tenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : ['Unknown']);
      
      tenures.forEach(tenure => {
        const tenureKey = tenure || 'Unknown';
        if (!grouped[tenureKey]) {
          grouped[tenureKey] = [];
        }
        // Only add member if not already in this tenure group (avoid duplicates)
        if (!grouped[tenureKey].some(m => m.id === member.id)) {
          grouped[tenureKey].push(member);
        }
      });
    });
    
    // Sort members within each tenure by order_by_tenure
    Object.keys(grouped).forEach(tenureKey => {
      grouped[tenureKey].sort((a, b) => {
        const orderA = a.order_by_tenure?.[tenureKey] ?? a.order ?? 9999;
        const orderB = b.order_by_tenure?.[tenureKey] ?? b.order ?? 9999;
        return orderA - orderB;
      });
    });
    
    // Sort tenures in descending order (newest first)
    const sortedTenures = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return b.localeCompare(a);
    });
    
    return { grouped, sortedTenures };
  };

  useEffect(() => {
    fetchMembers();
    fetchTenures();
  }, []);

  const fetchTenures = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/members/tenures/?member_type=team`);
      const tenures = res.data || [];
      
      // Ensure current tenure is always included
      const currentYear = new Date().getFullYear();
      const currentTenure = `${currentYear}-${currentYear + 1}`;
      
      if (!tenures.includes(currentTenure)) {
        tenures.push(currentTenure);
      }
      
      // Sort tenures in descending order (newest first)
      const sortedTenures = tenures.sort((a, b) => {
        const yearA = parseInt(a.split('-')[0]);
        const yearB = parseInt(b.split('-')[0]);
        return yearB - yearA;
      });
      
      setAvailableTenures(sortedTenures);
    } catch (err) {
      console.error('Error fetching tenures:', err);
      // Fallback to current tenure if API fails
      const currentYear = new Date().getFullYear();
      const currentTenure = `${currentYear}-${currentYear + 1}`;
      setAvailableTenures([currentTenure]);
    }
  };

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // toast.info("Loading team data...", { autoClose: 1000 });

      // Use the correct endpoints that exist in your backend
      const [teamRes, advisorsRes] = await Promise.all([
  axios.get(`${API_BASE_URL}/team-members/`),
  axios.get(`${API_BASE_URL}/advisors/`)
      ]);

      // Ensure order_by_tenure exists for all members (initialize if missing)
      const teamData = Array.isArray(teamRes.data) ? teamRes.data.map(member => ({
        ...member,
        order_by_tenure: member.order_by_tenure || {}
      })) : [];
      
      const advisorsData = Array.isArray(advisorsRes.data) ? advisorsRes.data.map(member => ({
        ...member,
        order_by_tenure: member.order_by_tenure || {}
      })) : [];

      setTeamMembers(teamData);
      setAdvisors(advisorsData);
      toast.dismiss();
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load team data");
      toast.error("Failed to fetch team members. Please try again.");
      setTeamMembers([]);
      setAdvisors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, type, name) => {
  if (deleteConfirm !== `${id}-${type}`) {
    setDeleteConfirm(`${id}-${type}`);
    return;
  }

  try {
  await axios.delete(`${API_BASE_URL}/members/${id}`);
    toast.success(`${name} deleted successfully`);
    setDeleteConfirm(null);
    fetchMembers();
  } catch (error) {
    console.error('Error deleting member:', error);
    toast.error(`Failed to delete ${name}. Please try again.`);
    setDeleteConfirm(null);
  }
};

  const handleEdit = (member) => {
    // Convert roles_by_tenure to format for form, with backward compatibility
    const tenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : []);
    const rolesByTenure = member.roles_by_tenure || {};
    
    // If no roles_by_tenure but has role, create roles_by_tenure from role
    if (!member.roles_by_tenure && member.role && tenures.length > 0) {
      tenures.forEach(t => {
        if (!rolesByTenure[t]) {
          rolesByTenure[t] = member.role;
        }
      });
    }
    
    setCurrentMember({
      id: member.id,
      name: member.name,
      role: member.role || '', // Keep for backward compatibility
      roles_by_tenure: rolesByTenure,
      member_type: member.member_type,
      tenure: tenures,
      bio: member.bio || '',
      email: member.email || '',  // Email for member portal
      image_url: member.image_url || '',
      socials: {
        linkedin: member.socials?.linkedin || '',
        github: member.socials?.github || '',
        twitter: member.socials?.twitter || '',
        portfolio: member.socials?.portfolio || ''
      },
      skills: member.skills || [],
      projects: member.projects || [],
      experience: member.experience || [],
      education: member.education || []
    });
    setIsEditing(true);
    toast.info(`Editing ${member.name}`, { autoClose: 1500 });
  };

  const handleSave = async (memberData) => {
  try {
    const getCurrentTenure = () => {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    };
    
    const formData = new FormData();
    formData.append('name', memberData.name);
    // Keep role for backward compatibility (use first role from roles_by_tenure if available)
    const rolesByTenure = memberData.roles_by_tenure || {};
    const tenures = Array.isArray(memberData.tenure) ? memberData.tenure : (memberData.tenure ? [memberData.tenure] : [getCurrentTenure()]);
    const firstRole = tenures.length > 0 && rolesByTenure[tenures[0]] ? rolesByTenure[tenures[0]] : (memberData.role || 'Member');
    formData.append('role', firstRole);
    formData.append('roles_by_tenure', JSON.stringify(rolesByTenure));
    formData.append('member_type', memberData.member_type);
    // Always append tenure - support multiple tenures as JSON array
    formData.append('tenure', JSON.stringify(tenures));
    console.log('Saving with tenures:', tenures);
    console.log('Saving with roles_by_tenure:', rolesByTenure);
    formData.append('bio', memberData.bio || '');
    
    // Append social links as flat fields (correct way)
    formData.append('linkedin', memberData.socials?.linkedin || '');
    formData.append('github', memberData.socials?.github || '');
    formData.append('twitter', memberData.socials?.twitter || '');
    formData.append('portfolio', memberData.socials?.portfolio || '');
  // Append portfolio fields as JSON strings
  formData.append('skills', JSON.stringify(memberData.skills || []));
  formData.append('projects', JSON.stringify(memberData.projects || []));
  formData.append('experience', JSON.stringify(memberData.experience || []));
  formData.append('education', JSON.stringify(memberData.education || []));
  
  // Append email for member portal login
  if (memberData.email) {
    formData.append('email', memberData.email);
  }
    
    // Append image if it's a new file
    if (memberData.image && typeof memberData.image !== 'string') {
      formData.append('image', memberData.image);
    }

  const url = `${API_BASE_URL}/members/${memberData.id || ''}`;
    const method = memberData.id ? 'put' : 'post';
    
    const response = await axios[method](url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const action = memberData.id ? 'updated' : 'added';
    toast.success(`${memberData.name} has been ${action} successfully`);
    
    setIsEditing(false);
    setCurrentMember(null);
    fetchMembers();
    
  } catch (error) {
    console.error('Error saving member:', error);
    const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'An error occurred while saving';
    toast.error(`Failed to save: ${errorMessage}`);
  }
};
  const cancelDelete = () => {
    setDeleteConfirm(null);
    toast.info('Delete cancelled', { autoClose: 1000 });
  };

  // Fetch members with email for announcements
  const fetchMembersWithEmail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_BASE_URL}/admin/team/members-with-email`, {
        headers: { adminAuthToken: token }
      });
      setMembersWithEmail(res.data.members || []);
    } catch (err) {
      console.error('Error fetching members with email:', err);
    }
  };

  // Send team announcement
  const handleSendAnnouncement = async () => {
    if (!announcementData.subject.trim() || !announcementData.message.trim()) {
      toast.error("Please enter subject and message");
      return;
    }

    setIsSendingAnnouncement(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${API_BASE_URL}/admin/team/send-announcement`,
        announcementData,
        { headers: { adminAuthToken: token } }
      );
      
      toast.success(res.data.message || "Announcement sent successfully!");
      setShowAnnouncementModal(false);
      setAnnouncementData({
        subject: "",
        message: "",
        include_portal_link: true,
        member_type: "all"
      });
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to send announcement";
      toast.error(errorMsg);
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  // Notify members about portal access
  const handleNotifyPortalAccess = async (notifyAll = false) => {
    setIsSendingNotify(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${API_BASE_URL}/admin/team/notify-portal-access`,
        { notify_all: notifyAll },
        { headers: { adminAuthToken: token } }
      );
      
      toast.success(res.data.message || "Notifications sent!");
      setShowNotifyModal(false);
      fetchMembersWithEmail(); // Refresh the list
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to send notifications";
      toast.error(errorMsg);
    } finally {
      setIsSendingNotify(false);
    }
  };

  // Open announcement modal
  const openAnnouncementModal = () => {
    fetchMembersWithEmail();
    setShowAnnouncementModal(true);
  };

  // Open notify modal
  const openNotifyModal = () => {
    fetchMembersWithEmail();
    setShowNotifyModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-300">Loading team data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-400 mb-4 text-center">
          <p className="text-xl">⚠️ Error loading team data</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
        <button 
          onClick={fetchMembers}
          className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">
            Manage Team
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Update team members and advisors information
        </p>
        
        {/* Team Communication Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAnnouncementModal}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium shadow-lg"
          >
            <MegaphoneIcon className="h-5 w-5 mr-2" />
            Team Announcement
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openNotifyModal}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white font-medium shadow-lg"
          >
            <BellAlertIcon className="h-5 w-5 mr-2" />
            Notify Portal Access
          </motion.button>
        </div>
      </motion.div>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center text-white">
                <MegaphoneIcon className="h-6 w-6 mr-2 text-purple-400" />
                Team Announcement
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                This will send an email to {membersWithEmail.length} member(s) with registered emails
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Send To
                </label>
                <select
                  value={announcementData.member_type}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, member_type: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Members ({membersWithEmail.length})</option>
                  <option value="team">Team Members Only ({membersWithEmail.filter(m => m.member_type === 'team').length})</option>
                  <option value="advisor">Advisors Only ({membersWithEmail.filter(m => m.member_type === 'advisor').length})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={announcementData.subject}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter announcement subject..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  value={announcementData.message}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your announcement message..."
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include_portal_link"
                  checked={announcementData.include_portal_link}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, include_portal_link: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="include_portal_link" className="ml-2 text-sm text-gray-300">
                  Include Member Portal link in email
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                disabled={isSendingAnnouncement}
              >
                Cancel
              </button>
              <button
                onClick={handleSendAnnouncement}
                disabled={isSendingAnnouncement || !announcementData.subject || !announcementData.message}
                className={`flex items-center px-6 py-2 rounded-lg text-white font-medium transition ${
                  isSendingAnnouncement || !announcementData.subject || !announcementData.message
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                }`}
              >
                {isSendingAnnouncement ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Send Announcement
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notify Portal Access Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center text-white">
                <BellAlertIcon className="h-6 w-6 mr-2 text-green-400" />
                Notify Portal Access
              </h2>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-300 mb-2 font-medium">
                Send welcome emails to team members about their portal access
              </p>
              <p className="text-sm text-gray-400">
                This will notify members about how to login to the Member Portal to update their portfolios.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">Members with Email ({membersWithEmail.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2 bg-gray-900 rounded-lg p-3">
                {membersWithEmail.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No members have registered emails yet.</p>
                ) : (
                  membersWithEmail.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-gray-400 text-sm">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${member.member_type === 'advisor' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          {member.member_type}
                        </span>
                        {member.portal_notified && (
                          <span className="flex items-center text-green-400 text-xs">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Notified
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowNotifyModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                disabled={isSendingNotify}
              >
                Cancel
              </button>
              <button
                onClick={() => handleNotifyPortalAccess(true)}
                disabled={isSendingNotify || membersWithEmail.length === 0}
                className={`flex items-center px-6 py-2 rounded-lg text-white font-medium transition ${
                  isSendingNotify || membersWithEmail.length === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                }`}
              >
                {isSendingNotify ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Send to All ({membersWithEmail.length})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Team Members grouped by tenure */}
      {(() => {
        const { grouped, sortedTenures } = groupByTenure(teamMembers);
        return sortedTenures.map((tenure, tenureIndex) => (
          <motion.div
            key={tenure}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: tenureIndex * 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-blue-400" />
                  {tenure === 'Unknown' ? 'Team Members' : `${tenure} Team`}
                </h2>
                {tenure !== 'Unknown' && (
                  <span className="ml-4 px-3 py-1 bg-blue-500/20 border border-blue-400 rounded-full text-sm text-blue-300">
                    {tenure}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium"
                onClick={() => {
                  // Get current tenure (e.g., 2025-2026)
                  const currentYear = new Date().getFullYear();
                  const currentTenure = `${currentYear}-${currentYear + 1}`;
                  const newTenure = tenure === 'Unknown' ? currentTenure : tenure;
                  setCurrentMember({ 
                    id: null, 
                    name: "", 
                    role: "", 
                    roles_by_tenure: { [newTenure]: "" },
                    member_type: "team",
                    tenure: [newTenure],
                    bio: "",
                    email: "",
                    image_url: "",
                    socials: { linkedin: "", github: "", twitter: "", portfolio: "" },
                    skills: [],
                    projects: [],
                    experience: [],
                    education: []
                  });
                  setIsEditing(true);
                  toast.info(`Adding new team member to ${tenure === 'Unknown' ? currentTenure : tenure}`, { autoClose: 1500 });
                }}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Member
              </motion.button>
            </div>
            <DragDropContext
              onDragEnd={async (result) => {
                if (!result.destination) return;
                const tenureMembers = Array.from(grouped[tenure]);
                const [removed] = tenureMembers.splice(result.source.index, 1);
                tenureMembers.splice(result.destination.index, 0, removed);
                
                // Update only the members in this tenure group
                const updatedMembers = [...teamMembers];
                tenureMembers.forEach((member, idx) => {
                  const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
                  if (memberIndex >= 0) {
                    // Update order_by_tenure for this member
                    updatedMembers[memberIndex] = {
                      ...updatedMembers[memberIndex],
                      order_by_tenure: {
                        ...(updatedMembers[memberIndex].order_by_tenure || {}),
                        [tenure]: idx
                      }
                    };
                  }
                });
                
                setTeamMembers(updatedMembers);
                
                // Send new order to backend with tenure
                try {
                  await axios.post(`${API_BASE_URL}/team-members/reorder`, {
                    order: tenureMembers.map((m) => m.id),
                    tenure: tenure
                  });
                  toast.success(`Team order updated for ${tenure}`);
                  // Refresh data from backend to ensure persistence
                  await fetchMembers();
                } catch (err) {
                  toast.error("Failed to update team order");
                  // Revert local changes on error
                  fetchMembers();
                }
              }}
            >
              <Droppable droppableId={`team-members-${tenure}`}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {grouped[tenure].length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">
                        No members in this tenure. Add your first member.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {grouped[tenure].map((member, idx) => (
                          <Draggable key={member.id} draggableId={member.id} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <MemberCard
                                  member={member}
                                  type="team"
                                  tenure={tenure}
                                  index={idx}
                                  totalMembers={grouped[tenure].length}
                                  onMoveUp={async () => {
                                    if (idx > 0) {
                                      const tenureMembers = Array.from(grouped[tenure]);
                                      [tenureMembers[idx], tenureMembers[idx - 1]] = [tenureMembers[idx - 1], tenureMembers[idx]];
                                      
                                      // Update only the members in this tenure group
                                      const updatedMembers = [...teamMembers];
                                      tenureMembers.forEach((member, newIdx) => {
                                        const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
                                        if (memberIndex >= 0) {
                                          updatedMembers[memberIndex] = {
                                            ...updatedMembers[memberIndex],
                                            order_by_tenure: {
                                              ...(updatedMembers[memberIndex].order_by_tenure || {}),
                                              [tenure]: newIdx
                                            }
                                          };
                                        }
                                      });
                                      
                                      setTeamMembers(updatedMembers);
                                      try {
                                        await axios.post(`${API_BASE_URL}/team-members/reorder`, {
                                          order: tenureMembers.map((m) => m.id),
                                          tenure: tenure
                                        });
                                        toast.success(`Moved up in ${tenure}`);
                                        // Refresh data from backend to ensure persistence
                                        await fetchMembers();
                                      } catch (err) {
                                        toast.error("Failed to update team order");
                                        // Revert local changes on error
                                        fetchMembers();
                                      }
                                    }
                                  }}
                                  onMoveDown={async () => {
                                    if (idx < grouped[tenure].length - 1) {
                                      const tenureMembers = Array.from(grouped[tenure]);
                                      [tenureMembers[idx], tenureMembers[idx + 1]] = [tenureMembers[idx + 1], tenureMembers[idx]];
                                      
                                      // Update only the members in this tenure group
                                      const updatedMembers = [...teamMembers];
                                      tenureMembers.forEach((member, newIdx) => {
                                        const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
                                        if (memberIndex >= 0) {
                                          updatedMembers[memberIndex] = {
                                            ...updatedMembers[memberIndex],
                                            order_by_tenure: {
                                              ...(updatedMembers[memberIndex].order_by_tenure || {}),
                                              [tenure]: newIdx
                                            }
                                          };
                                        }
                                      });
                                      
                                      setTeamMembers(updatedMembers);
                                      try {
                                        await axios.post(`${API_BASE_URL}/team-members/reorder`, {
                                          order: tenureMembers.map((m) => m.id),
                                          tenure: tenure
                                        });
                                        toast.success(`Moved down in ${tenure}`);
                                        // Refresh data from backend to ensure persistence
                                        await fetchMembers();
                                      } catch (err) {
                                        toast.error("Failed to update team order");
                                        // Revert local changes on error
                                        fetchMembers();
                                      }
                                    }
                                  }}
                                  onPositionChange={async (newIndex) => {
                                    const tenureMembers = Array.from(grouped[tenure]);
                                    const currentIndex = idx;
                                    
                                    if (newIndex === currentIndex) return;
                                    
                                    // Remove member from current position
                                    const [movedMember] = tenureMembers.splice(currentIndex, 1);
                                    // Insert at new position
                                    tenureMembers.splice(newIndex, 0, movedMember);
                                    
                                    // Update only the members in this tenure group
                                    const updatedMembers = [...teamMembers];
                                    tenureMembers.forEach((member, newIdx) => {
                                      const memberIndex = updatedMembers.findIndex(m => m.id === member.id);
                                      if (memberIndex >= 0) {
                                        updatedMembers[memberIndex] = {
                                          ...updatedMembers[memberIndex],
                                          order_by_tenure: {
                                            ...(updatedMembers[memberIndex].order_by_tenure || {}),
                                            [tenure]: newIdx
                                          }
                                        };
                                      }
                                    });
                                    
                                    setTeamMembers(updatedMembers);
                                    try {
                                      await axios.post(`${API_BASE_URL}/team-members/reorder`, {
                                        order: tenureMembers.map((m) => m.id),
                                        tenure: tenure
                                      });
                                      toast.success(`Position updated in ${tenure}`);
                                      // Refresh data from backend to ensure persistence
                                      await fetchMembers();
                                    } catch (err) {
                                      toast.error("Failed to update team order");
                                      // Revert local changes on error
                                      fetchMembers();
                                    }
                                  }}
                                  dragHandleProps={provided.dragHandleProps}
                                  onEdit={() => handleEdit(member)}
                                  onDelete={() => handleDelete(member.id, "team", member.name)}
                                  isDeleteConfirming={deleteConfirm === `${member.id}-team`}
                                  cancelDelete={cancelDelete}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </motion.div>
        ));
      })()}

      <MemberSection
        title="Advisors"
        icon={AcademicCapIcon}
        members={advisors}
        type="advisor"
        onAdd={() => {
          const currentYear = new Date().getFullYear();
          const currentTenure = `${currentYear}-${currentYear + 1}`;
          setCurrentMember({ 
            id: null, 
            name: "", 
            role: "", 
            roles_by_tenure: { [currentTenure]: "" },
            member_type: "advisor",
            tenure: [currentTenure],
            bio: "",
            email: "",
            image_url: "",
            socials: { linkedin: "", github: "", twitter: "", portfolio: "" },
            skills: [],
            projects: [],
            experience: [],
            education: []
          });
          setIsEditing(true);
          toast.info("Adding new advisor", { autoClose: 1500 });
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteConfirm={deleteConfirm}
        cancelDelete={cancelDelete}
      />

      {isEditing && (
        <TeamMemberForm
          member={currentMember}
          onSave={handleSave}
          availableTenures={availableTenures}
          onCancel={() => {
            setIsEditing(false);
            setCurrentMember(null);
            toast.info('Edit cancelled', { autoClose: 1000 });
          }}
        />
      )}
    </div>
  );
};

const MemberSection = ({ 
  title, 
  icon: Icon, 
  members, 
  type, 
  onAdd, 
  onEdit, 
  onDelete,
  deleteConfirm,
  cancelDelete,
  Draggable
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    className="bg-gray-800 rounded-xl p-6 border border-gray-700"
  >
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold flex items-center">
        <Icon className="h-6 w-6 mr-2 text-blue-400" />
        {title}
      </h2>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium"
        onClick={onAdd}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add {type === "team" ? "Member" : "Advisor"}
      </motion.button>
    </div>

    {members.length === 0 ? (
      <div className="text-center py-8 text-gray-400">
        No {type} members found. Add your first {type}.
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {type === "team" && Draggable
          ? members.map((member, idx) => (
              <Draggable key={member.id} draggableId={member.id} index={idx}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <MemberCard
                      member={member}
                      type={type}
                      onEdit={() => onEdit(member)}
                      onDelete={() => onDelete(member.id, type, member.name)}
                      isDeleteConfirming={deleteConfirm === `${member.id}-${type}`}
                      cancelDelete={cancelDelete}
                    />
                  </div>
                )}
              </Draggable>
            ))
          : members.map((member) => {
              // For advisors, get the first tenure or use default
              const memberTenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : []);
              const displayTenure = memberTenures.length > 0 ? memberTenures[0] : null;
              return (
                <MemberCard
                  key={member.id}
                  member={member}
                  type={type}
                  tenure={displayTenure}
                  onEdit={() => onEdit(member)}
                  onDelete={() => onDelete(member.id, type, member.name)}
                  isDeleteConfirming={deleteConfirm === `${member.id}-${type}`}
                  cancelDelete={cancelDelete}
                />
              );
            })}
      </div>
    )}
  </motion.div>
);

const MemberCard = ({ member, type, onEdit, onDelete, isDeleteConfirming, cancelDelete, tenure, index, totalMembers, onMoveUp, onMoveDown, onPositionChange, dragHandleProps }) => {
  const [isEditingPosition, setIsEditingPosition] = useState(false);
  const [positionValue, setPositionValue] = useState((index + 1).toString());
  
  // Update position value when index changes
  useEffect(() => {
    setPositionValue((index + 1).toString());
  }, [index]);
  
  // Get role for this specific tenure
  const getRoleForTenure = (member, tenure) => {
    if (member.roles_by_tenure && tenure && member.roles_by_tenure[tenure]) {
      return member.roles_by_tenure[tenure];
    }
    // Backward compatibility: use role field
    return member.role || 'Member';
  };
  
  const displayRole = tenure ? getRoleForTenure(member, tenure) : (member.role || 'Member');
  
  const handlePositionSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newPosition = parseInt(positionValue);
    if (newPosition >= 1 && newPosition <= totalMembers && newPosition !== index + 1) {
      if (onPositionChange) {
        onPositionChange(newPosition - 1); // Convert to 0-based index
      }
    }
    setIsEditingPosition(false);
  };
  
  const handlePositionKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePositionSubmit(e);
    } else if (e.key === 'Escape') {
      setPositionValue((index + 1).toString());
      setIsEditingPosition(false);
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gray-700 rounded-xl p-6 border border-gray-600 relative"
    >
      {isDeleteConfirming && (
        <div className="absolute inset-0 bg-gray-900/90 rounded-xl flex flex-col items-center justify-center p-4 z-10">
          <p className="text-center mb-4 text-red-300 font-medium">Delete {member.name}?</p>
          <div className="flex space-x-3">
            <button 
              onClick={onDelete}
              className="px-3 py-1 bg-red-600 rounded-md text-white hover:bg-red-700"
            >
              Confirm
            </button>
            <button 
              onClick={cancelDelete}
              className="px-3 py-1 bg-gray-600 rounded-md text-white hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div className="flex items-center mb-4 flex-1">
          <div className="relative mr-4">
            {member.image_url ? (
              <img 
                src={member.image_url} 
                alt={member.name} 
                className="h-12 w-12 rounded-full object-cover border-2 border-blue-400"
              />
            ) : (
              <div className="bg-blue-500/10 p-2 rounded-full">
                <UserIcon className="h-8 w-8 text-blue-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{member.name}</h3>
            <p className="text-blue-300">{displayRole}</p>
            {tenure && member.roles_by_tenure && Object.keys(member.roles_by_tenure).length > 1 && (
              <p className="text-xs text-gray-400 mt-1">{tenure}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          {type === "team" && onMoveUp && onMoveDown && (
            <div className="flex flex-col gap-1 mb-2 bg-gray-800/50 rounded-lg p-1">
              <motion.button
                onClick={onMoveUp}
                disabled={index === 0}
                className={`px-2 py-1 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
                whileHover={index > 0 ? { scale: 1.1 } : {}}
                whileTap={index > 0 ? { scale: 0.9 } : {}}
                title="Move up"
              >
                <ArrowUpIcon className="h-5 w-5" />
              </motion.button>
              {isEditingPosition ? (
                <form onSubmit={handlePositionSubmit} className="flex items-center justify-center">
                  <input
                    type="number"
                    min="1"
                    max={totalMembers}
                    value={positionValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= totalMembers)) {
                        setPositionValue(val);
                      }
                    }}
                    onBlur={handlePositionSubmit}
                    onKeyDown={handlePositionKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 text-center text-xs font-bold bg-gray-700 text-white border border-blue-500 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </form>
              ) : (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingPosition(true);
                  }}
                  className="text-center text-xs text-gray-500 font-bold px-1 py-1 cursor-pointer hover:text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                  title="Click to edit position"
                >
                  {index + 1}
                </div>
              )}
              <motion.button
                onClick={onMoveDown}
                disabled={index >= totalMembers - 1}
                className={`px-2 py-1 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
                whileHover={index < totalMembers - 1 ? { scale: 1.1 } : {}}
                whileTap={index < totalMembers - 1 ? { scale: 0.9 } : {}}
                title="Move down"
              >
                <ArrowDownIcon className="h-5 w-5" />
              </motion.button>
            </div>
          )}
          <div className="flex space-x-2">
            <motion.button 
              onClick={onEdit} 
              className="text-gray-400 hover:text-blue-400"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Edit"
            >
              <PencilIcon className="h-5 w-5" />
            </motion.button>
            <motion.button 
              onClick={() => onDelete()} 
              className="text-gray-400 hover:text-red-400"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Delete"
            >
              <TrashIcon className="h-5 w-5" />
            </motion.button>
          </div>
          {type === "team" && dragHandleProps && (
            <div {...dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300" title="Drag to reorder">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
      
      {member.bio && (
        <p className="text-sm text-gray-300 mt-3 line-clamp-2">{member.bio}</p>
      )}
      
      <div className="flex flex-wrap gap-3 mt-4">
        {member.socials?.linkedin && (
          <a 
            href={member.socials.linkedin} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:underline flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </a>
        )}
        {member.socials?.github && (
          <a 
            href={member.socials.github} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-300 hover:underline flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        )}
        {member.socials?.twitter && (
          <a 
            href={member.socials.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-300 hover:underline flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
            Twitter
          </a>
        )}
        {member.socials?.portfolio && (
          <a 
            href={member.socials.portfolio} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-purple-300 hover:underline flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Portfolio
          </a>
        )}
      </div>
    </motion.div>
  );
};

const TeamMemberForm = ({ member, onSave, onCancel, availableTenures = [] }) => {
  // Get current tenure as default
  const getCurrentTenure = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };

  const [showCustomTenure, setShowCustomTenure] = useState(false);
  const [customTenureValue, setCustomTenureValue] = useState('');

  // Initialize roles_by_tenure from member data with backward compatibility
  const initializeRolesByTenure = (member) => {
    if (!member) return {};
    const tenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : [getCurrentTenure()]);
    if (member.roles_by_tenure) {
      return member.roles_by_tenure;
    } else if (member.role && tenures.length > 0) {
      // Backward compatibility: create roles_by_tenure from single role
      const roles = {};
      tenures.forEach(t => {
        roles[t] = member.role;
      });
      return roles;
    }
    return {};
  };

  const [formData, setFormData] = useState({
    name: member?.name || "",
    role: member?.role || "",
    roles_by_tenure: initializeRolesByTenure(member),
    member_type: member?.member_type || "team",
    tenure: Array.isArray(member?.tenure) ? member.tenure : (member?.tenure ? [member.tenure] : [getCurrentTenure()]),
    bio: member?.bio || "",
    email: member?.email || "",  // Email for member portal login
    image: member?.image_url || null,
    image_url: member?.image_url || "",
    socials: {
      linkedin: member?.socials?.linkedin || "",
      github: member?.socials?.github || "",
      twitter: member?.socials?.twitter || "",
      portfolio: member?.socials?.portfolio || ""
    }
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [projectTemp, setProjectTemp] = useState({ title: '', description: '', url: '' });
  const [experienceTemp, setExperienceTemp] = useState({ role: '', company: '', period: '', description: '' });
  const [educationTemp, setEducationTemp] = useState({ degree: '', institution: '', period: '' });

  const addProject = () => {
    setFormData(prev => ({ ...prev, projects: [...(prev.projects || []), projectTemp] }));
    setProjectTemp({ title: '', description: '', url: '' });
  };

  const removeProject = (idx) => {
    setFormData(prev => ({ ...prev, projects: (prev.projects || []).filter((_, i) => i !== idx) }));
  };

  const addExperience = () => {
    setFormData(prev => ({ ...prev, experience: [...(prev.experience || []), experienceTemp] }));
    setExperienceTemp({ role: '', company: '', period: '', description: '' });
  };

  const removeExperience = (idx) => {
    setFormData(prev => ({ ...prev, experience: (prev.experience || []).filter((_, i) => i !== idx) }));
  };

  const addEducation = () => {
    setFormData(prev => ({ ...prev, education: [...(prev.education || []), educationTemp] }));
    setEducationTemp({ degree: '', institution: '', period: '' });
  };

  const removeEducation = (idx) => {
    setFormData(prev => ({ ...prev, education: (prev.education || []).filter((_, i) => i !== idx) }));
  };

  useEffect(() => {
    // When member prop changes, ensure formData includes arrays
    // IMPORTANT: Preserve tenure if it's already set (for custom tenures)
    setFormData(prev => {
      const tenures = prev.tenure && prev.tenure.length > 0 ? prev.tenure : (Array.isArray(member?.tenure) ? member.tenure : (member?.tenure ? [member.tenure] : [getCurrentTenure()]));
      const rolesByTenure = member?.roles_by_tenure || {};
      
      // If no roles_by_tenure but has role, create roles_by_tenure from role
      if (!member?.roles_by_tenure && member?.role && tenures.length > 0) {
        tenures.forEach(t => {
          if (!rolesByTenure[t]) {
            rolesByTenure[t] = member.role;
          }
        });
      }
      
      return {
        ...prev,
        skills: member?.skills || prev.skills || [],
        projects: member?.projects || prev.projects || [],
        experience: member?.experience || prev.experience || [],
        education: member?.education || prev.education || [],
        // Preserve tenure if it's already set (for custom tenures)
        tenure: tenures,
        roles_by_tenure: Object.keys(rolesByTenure).length > 0 ? rolesByTenure : prev.roles_by_tenure || {}
      };
    });
  }, [member]);
  const [imagePreview, setImagePreview] = useState(member?.image_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (!skillsInput) return;
    setFormData(prev => ({ ...prev, skills: [...(prev.skills || []), skillsInput] }));
    setSkillsInput('');
  };

  const removeSkill = (idx) => {
    setFormData(prev => ({ ...prev, skills: (prev.skills || []).filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      await onSave({
        ...formData,
        id: member?.id || null
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {member?.id ? 'Edit' : 'Add'} {formData.member_type === 'team' ? 'Team Member' : 'Advisor'}
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email <span className="text-xs text-gray-400">(for Member Portal)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="member@example.com"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Add email to allow member to login and update their portfolio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Roles by Tenure *
              </label>
              <div className="space-y-3">
                {(() => {
                  const tenures = Array.isArray(formData.tenure) ? formData.tenure : (formData.tenure ? [formData.tenure] : [getCurrentTenure()]);
                  return tenures.map((tenure, index) => (
                    <div key={tenure || index} className="flex items-center gap-3">
                      <label className="text-sm text-gray-400 w-32 flex-shrink-0">
                        {tenure || 'Tenure'}:
                      </label>
                      <input
                        type="text"
                        value={formData.roles_by_tenure?.[tenure] || ''}
                        onChange={(e) => {
                          const newRolesByTenure = { ...formData.roles_by_tenure };
                          newRolesByTenure[tenure] = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            roles_by_tenure: newRolesByTenure,
                            role: e.target.value // Update legacy role field for backward compatibility
                          }));
                        }}
                        placeholder="Enter role for this tenure"
                        required
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ));
                })()}
                {formData.tenure && formData.tenure.length === 0 && (
                  <p className="text-xs text-gray-400">Please add at least one tenure first</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type *
              </label>
              <select
                name="member_type"
                value={formData.member_type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="team">Team Member</option>
                <option value="advisor">Advisor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tenures * <span className="text-xs text-gray-400">(Select multiple)</span>
              </label>
              {!showCustomTenure ? (
                <div className="space-y-2">
                  <div className="max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-3 space-y-2">
                    {(() => {
                      // Get current tenure
                      const currentYear = new Date().getFullYear();
                      const currentTenure = `${currentYear}-${currentYear + 1}`;
                      
                      // Combine available tenures with current tenure if not present
                      const allTenures = new Set(availableTenures);
                      allTenures.add(currentTenure);
                      
                      // Add any custom tenures from formData
                      const currentTenures = Array.isArray(formData.tenure) ? formData.tenure : (formData.tenure ? [formData.tenure] : []);
                      currentTenures.forEach(t => {
                        if (t && /^\d{4}-\d{4}$/.test(t)) {
                          allTenures.add(t);
                        }
                      });
                      
                      // Sort tenures in descending order (newest first)
                      const sortedTenures = Array.from(allTenures).sort((a, b) => {
                        const yearA = parseInt(a.split('-')[0]);
                        const yearB = parseInt(b.split('-')[0]);
                        return yearB - yearA;
                      });
                      
                      return sortedTenures.map(tenure => {
                        const isSelected = currentTenures.includes(tenure);
                        return (
                          <label key={tenure} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentTenures = Array.isArray(formData.tenure) ? formData.tenure : (formData.tenure ? [formData.tenure] : []);
                                if (e.target.checked) {
                                  // Add tenure
                                  if (!currentTenures.includes(tenure)) {
                                    const newTenures = [...currentTenures, tenure];
                                    const newRolesByTenure = { ...formData.roles_by_tenure };
                                    // Initialize role for new tenure if not set
                                    if (!newRolesByTenure[tenure]) {
                                      // Use first existing role or default
                                      const defaultRole = Object.values(newRolesByTenure)[0] || formData.role || 'Member';
                                      newRolesByTenure[tenure] = defaultRole;
                                    }
                                    setFormData(prev => ({ ...prev, tenure: newTenures, roles_by_tenure: newRolesByTenure }));
                                  }
                                } else {
                                  // Remove tenure (but keep at least one)
                                  if (currentTenures.length > 1) {
                                    const newTenures = currentTenures.filter(t => t !== tenure);
                                    const newRolesByTenure = { ...formData.roles_by_tenure };
                                    delete newRolesByTenure[tenure];
                                    setFormData(prev => ({ ...prev, tenure: newTenures, roles_by_tenure: newRolesByTenure }));
                                  } else {
                                    alert('At least one tenure must be selected');
                                  }
                                }
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-white">
                              {tenure} {tenure === currentTenure ? '(Current)' : ''}
                            </span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomTenure(true);
                      const currentTenures = Array.isArray(formData.tenure) ? formData.tenure : (formData.tenure ? [formData.tenure] : []);
                      setCustomTenureValue(currentTenures.join(', '));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    + Add Custom Tenure
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="2024-2025 or 2024"
                      value={customTenureValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow format like "2024-2025" or just typing numbers and dash
                        if (value === '' || /^[\d-]*$/.test(value)) {
                          setCustomTenureValue(value);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Allow Enter key to submit
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          let finalValue = customTenureValue.trim();
                          
                          // Auto-format if just year entered
                          if (/^\d{4}$/.test(finalValue)) {
                            const year = parseInt(finalValue);
                            finalValue = `${year}-${year + 1}`;
                          }
                          
                          // Validate and set
                          if (/^\d{4}-\d{4}$/.test(finalValue)) {
                            setFormData(prev => ({ ...prev, tenure: finalValue }));
                            setCustomTenureValue(finalValue);
                            setShowCustomTenure(false);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Auto-format if user types just year (e.g., "2024" becomes "2024-2025")
                        const value = e.target.value.trim();
                        if (/^\d{4}$/.test(value)) {
                          const year = parseInt(value);
                          const formatted = `${year}-${year + 1}`;
                          setCustomTenureValue(formatted);
                        } else if (/^\d{4}-\d{4}$/.test(value)) {
                          // Valid format, keep it
                        }
                      }}
                      required
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        let finalValue = customTenureValue.trim();
                        
                        // Auto-format if just year entered
                        if (/^\d{4}$/.test(finalValue)) {
                          const year = parseInt(finalValue);
                          finalValue = `${year}-${year + 1}`;
                        }
                        
                        // Parse multiple tenures (comma-separated)
                        const tenureList = finalValue.split(',').map(t => t.trim()).filter(t => t);
                        const validTenures = [];
                        
                        for (const t of tenureList) {
                          if (/^\d{4}-\d{4}$/.test(t)) {
                            validTenures.push(t);
                          } else if (/^\d{4}$/.test(t)) {
                            const year = parseInt(t);
                            validTenures.push(`${year}-${year + 1}`);
                          }
                        }
                        
                        if (validTenures.length > 0) {
                          // Add custom tenures to existing ones
                          const currentTenures = Array.isArray(formData.tenure) ? formData.tenure : (formData.tenure ? [formData.tenure] : []);
                          const allTenures = [...new Set([...currentTenures, ...validTenures])]; // Remove duplicates
                          const newRolesByTenure = { ...formData.roles_by_tenure };
                          // Initialize roles for new tenures
                          validTenures.forEach(t => {
                            if (!newRolesByTenure[t]) {
                              const defaultRole = Object.values(newRolesByTenure)[0] || formData.role || 'Member';
                              newRolesByTenure[t] = defaultRole;
                            }
                          });
                          setFormData(prev => {
                            console.log('Setting tenures to:', allTenures);
                            return { ...prev, tenure: allTenures, roles_by_tenure: newRolesByTenure };
                          });
                          setCustomTenureValue(allTenures.join(', '));
                          setShowCustomTenure(false);
                        } else {
                          alert('Please enter tenure(s) in format YYYY-YYYY (e.g., 2024-2025) or just YYYY (e.g., 2024). Multiple tenures can be comma-separated.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomTenure(false);
                        setCustomTenureValue(formData.tenure);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Enter tenure in format: YYYY-YYYY (e.g., 2024-2025). You can also type just the year (e.g., 2024) and it will auto-format.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {imagePreview && (
            <div className="flex justify-center">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-32 w-32 rounded-full object-cover border-2 border-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Portfolio sections: Skills, Projects, Experience, Education */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Add a skill and press Add"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <button type="button" onClick={addSkill} className="px-4 py-2 bg-blue-600 rounded text-white">Add</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(formData.skills || []).map((s, i) => (
                  <span key={i} className="bg-gray-600 px-3 py-1 rounded flex items-center gap-2">
                    {s}
                    <button type="button" onClick={() => removeSkill(i)} className="text-red-300">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Projects</label>
              <div className="grid grid-cols-1 gap-2">
                <input type="text" placeholder="Title" value={projectTemp.title} onChange={(e)=>setProjectTemp(prev=>({...prev,title:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                <input type="text" placeholder="URL" value={projectTemp.url} onChange={(e)=>setProjectTemp(prev=>({...prev,url:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                <input type="text" placeholder="Short description" value={projectTemp.description} onChange={(e)=>setProjectTemp(prev=>({...prev,description:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                <div className="flex gap-2">
                  <button type="button" onClick={addProject} className="px-4 py-2 bg-blue-600 rounded text-white">Add Project</button>
                </div>
                <div className="mt-2 space-y-2">
                  {(formData.projects || []).map((p, i) => (
                    <div key={i} className="bg-gray-700 p-2 rounded flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{p.title}</div>
                        <div className="text-sm text-gray-300">{p.description}</div>
                        {p.url && <a href={p.url} className="text-teal-300 text-sm" target="_blank" rel="noreferrer">Link</a>}
                      </div>
                      <button type="button" onClick={()=>removeProject(i)} className="text-red-400">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Experience</label>
              <input type="text" placeholder="Role" value={experienceTemp.role} onChange={(e)=>setExperienceTemp(prev=>({...prev,role:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <input type="text" placeholder="Company" value={experienceTemp.company} onChange={(e)=>setExperienceTemp(prev=>({...prev,company:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <input type="text" placeholder="Period" value={experienceTemp.period} onChange={(e)=>setExperienceTemp(prev=>({...prev,period:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <input type="text" placeholder="Description" value={experienceTemp.description} onChange={(e)=>setExperienceTemp(prev=>({...prev,description:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={addExperience} className="px-4 py-2 bg-blue-600 rounded text-white">Add Experience</button>
              </div>
              <div className="space-y-2">
                {(formData.experience || []).map((ex, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{ex.role} @ {ex.company}</div>
                      <div className="text-sm text-gray-300">{ex.period}</div>
                      <div className="text-sm text-gray-400">{ex.description}</div>
                    </div>
                    <button type="button" onClick={()=>removeExperience(i)} className="text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Education</label>
              <input type="text" placeholder="Degree" value={educationTemp.degree} onChange={(e)=>setEducationTemp(prev=>({...prev,degree:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <input type="text" placeholder="Institution" value={educationTemp.institution} onChange={(e)=>setEducationTemp(prev=>({...prev,institution:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <input type="text" placeholder="Period" value={educationTemp.period} onChange={(e)=>setEducationTemp(prev=>({...prev,period:e.target.value}))} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-2" />
              <div className="flex gap-2">
                <button type="button" onClick={addEducation} className="px-4 py-2 bg-blue-600 rounded text-white">Add Education</button>
              </div>
              <div className="space-y-2 mt-2">
                {(formData.education || []).map((ed, i) => (
                  <div key={i} className="bg-gray-700 p-2 rounded flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{ed.degree} — {ed.institution}</div>
                      <div className="text-sm text-gray-300">{ed.period}</div>
                    </div>
                    <button type="button" onClick={()=>removeEducation(i)} className="text-red-400">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.socials.linkedin}
                onChange={handleSocialChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GitHub URL
              </label>
              <input
                type="url"
                name="github"
                value={formData.socials.github}
                onChange={handleSocialChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Twitter URL
              </label>
              <input
                type="url"
                name="twitter"
                value={formData.socials.twitter}
                onChange={handleSocialChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                name="portfolio"
                value={formData.socials.portfolio}
                onChange={handleSocialChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminTeam;