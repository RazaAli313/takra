import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import toast from "react-hot-toast";
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const AdminContact = () => {
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simplified animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "easeOut",
        duration: 0.3
      }
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    }
  };

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
  const response = await axios.get(`${API_BASE_URL}/contact`);
        setContactInfo(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load contact information");
        setLoading(false);
        console.error(err);
      }
    };

    fetchContactInfo();
  }, []);

  const handleEdit = () => {
    setEditData({...contactInfo});
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
  const response = await axios.put(`${API_BASE_URL}/contact`, editData);
      setContactInfo(response.data);
      toast.success("Contact information updated successfully!");
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError("Failed to update contact information");
      toast.error("Failed to update contact information");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 rounded-lg text-white font-medium hover:bg-purple-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Manage Contact Info
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Update the contact information displayed on the website
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
      >
        <motion.div 
          variants={itemVariants}
          className="flex justify-between items-center mb-6"
        >
          <h2 className="text-2xl font-bold">Contact Information</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium transition-all duration-150"
            onClick={handleEdit}
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </motion.button>
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-6">
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="text-purple-400 mr-4 mt-1">
              <EnvelopeIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-gray-300">{contactInfo.email}</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="text-purple-400 mr-4 mt-1">
              <PhoneIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-gray-300">{contactInfo.phone}</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-start">
            <div className="text-purple-400 mr-4 mt-1">
              <MapPinIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Address</h3>
              <p className="text-gray-300 whitespace-pre-line">{contactInfo.address}</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Contact Info</h3>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg"
              >
                <p className="text-red-400">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
              >
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email || ""}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  required
                />
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.05 }}
              >
                <label className="block text-gray-400 mb-2">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editData.phone || ""}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  required
                />
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
              >
                <label className="block text-gray-400 mb-2">Address</label>
                <textarea
                  name="address"
                  value={editData.address || ""}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  required
                />
              </motion.div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium transition-all duration-150"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium transition-all duration-150"
                onClick={handleSave}
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminContact;