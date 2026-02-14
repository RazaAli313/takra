import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { 
  TrophyIcon,
  StarIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import axios from 'axios';
// import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from "../../utils/api";



const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md"
      >
        <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium"
            onClick={onClose}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium"
            onClick={onConfirm}
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminHallOfFame = () => {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState({
    year: "",
    month: "",
    title: "",
    description: "",
    icon: "TrophyIcon"
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    achievementId: null,
    achievementTitle: ""
  });
  const [achievementImage, setAchievementImage] = useState(null);

  const iconComponents = {
    TrophyIcon: <TrophyIcon className="h-8 w-8 text-yellow-400" />,
    StarIcon: <StarIcon className="h-8 w-8 text-yellow-400" />,
    AcademicCapIcon: <AcademicCapIcon className="h-8 w-8 text-yellow-400" />
  };

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/achievements`);
      setAchievements(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch achievements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleDeleteClick = (id, title) => {
    setDeleteModal({
      isOpen: true,
      achievementId: id,
      achievementTitle: title
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/achievements/${deleteModal.achievementId}`);
      fetchAchievements();
      toast.success('Achievement deleted successfully!');
      setDeleteModal({ isOpen: false, achievementId: null, achievementTitle: "" });
    } catch (err) {
      setError('Failed to delete achievement. Please try again.');
      toast.error('Failed to delete achievement.');
      setDeleteModal({ isOpen: false, achievementId: null, achievementTitle: "" });
    }
  };

  const handleEdit = (achievement) => {
    setCurrentAchievement(achievement);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('year', currentAchievement.year);
      formData.append('month', currentAchievement.month || "");
      formData.append('title', currentAchievement.title);
      formData.append('description', currentAchievement.description);
      formData.append('icon', currentAchievement.icon);
      if (achievementImage) {
        formData.append('image', achievementImage);
      }
      if (currentAchievement.id) {
        await axios.put(`${API_BASE_URL}/achievements/${currentAchievement.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Achievement updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/achievements`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Achievement created successfully!');
      }
      fetchAchievements();
      setIsEditing(false);
      setAchievementImage(null);
    } catch (err) {
      setError(`Failed to ${currentAchievement.id ? 'update' : 'create'} achievement. Please try again.`);
      toast.error(`Failed to ${currentAchievement.id ? 'update' : 'create'} achievement.`);
    }
  };

  const handleAddNew = () => {
    setCurrentAchievement({
      year: "",
      title: "",
      description: "",
      icon: "TrophyIcon"
    });
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={fetchAchievements}
          className="mt-2 px-4 py-2 bg-yellow-600 rounded-lg text-white font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover /> */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
            Manage Hall of Fame
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Update the achievements and milestones of the club
        </p>
      </motion.div>

      <motion.div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-white font-medium"
          onClick={handleAddNew}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Achievement
        </motion.button>
      </motion.div>

      {achievements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No achievements found. Add your first achievement!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-gray-700 mr-4">
                    {iconComponents[item.icon]}
                  </div>
                  <span className="text-xl font-bold text-yellow-400">
                    {[item.month, item.year].filter(Boolean).join(" ")}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-blue-400"
                    onClick={() => handleEdit(item)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => handleDeleteClick(item.id, item.title)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-300">{item.description}</p>
              {item.image_url && (
                <div className="mb-2">
                  <img src={item.image_url} alt={item.title} className="w-full max-h-64 object-cover rounded mx-auto" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md max-h-[90vh] flex flex-col my-auto"
          >
            <h3 className="text-xl font-bold p-6 pb-0 flex-shrink-0">
              {currentAchievement.id ? "Edit Achievement" : "Add New Achievement"}
            </h3>
            
            <div className="space-y-4 p-6 overflow-y-auto min-h-0 flex-1">
              <div>
                <label className="block text-gray-400 mb-2">Year</label>
                <input
                  type="text"
                  value={currentAchievement.year}
                  onChange={(e) => setCurrentAchievement({...currentAchievement, year: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g. 2024"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Month (optional)</label>
                <select
                  value={currentAchievement.month || ""}
                  onChange={(e) => setCurrentAchievement({...currentAchievement, month: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">— No month —</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={currentAchievement.title}
                  onChange={(e) => setCurrentAchievement({...currentAchievement, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g. Best Tech Society Award"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  value={currentAchievement.description}
                  onChange={(e) => setCurrentAchievement({...currentAchievement, description: e.target.value})}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g. Recognized as the most active and innovative tech society in the university."
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Icon</label>
                <select
                  value={currentAchievement.icon}
                  onChange={(e) => setCurrentAchievement({...currentAchievement, icon: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="TrophyIcon">Trophy</option>
                  <option value="StarIcon">Star</option>
                  <option value="AcademicCapIcon">Academic Cap</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAchievementImage(e.target.files[0])}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                {achievementImage && (
                  <div className="mt-2">
                    <img src={URL.createObjectURL(achievementImage)} alt="Preview" className="w-full max-h-48 object-cover rounded" />
                  </div>
                )}
                {currentAchievement.image_url && !achievementImage && (
                  <div className="mt-2">
                    <img src={currentAchievement.image_url} alt="Current" className="w-full max-h-48 object-cover rounded" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 pt-4 flex-shrink-0 border-t border-gray-700">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg text-white font-medium"
                onClick={handleSave}
              >
                {currentAchievement.id ? "Update" : "Save"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, achievementId: null, achievementTitle: "" })}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete the "${deleteModal.achievementTitle}" achievement? This action cannot be undone.`}
      />
    </div>
  );
};

export default AdminHallOfFame;