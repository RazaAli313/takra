import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";

import toast from "react-hot-toast";
import { 
  RocketLaunchIcon, 
  CodeBracketIcon, 
  UsersIcon, 
  LightBulbIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";

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

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl p-6 border border-slate-200 shadow-lg w-full max-w-md"
      >
        <h3 className="text-xl font-bold mb-4 text-slate-800">Confirm Deletion</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-slate-200 rounded-lg text-slate-800 font-medium hover:bg-slate-300 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ImageUpload = ({ currentImage, onImageChange, onRemoveImage }) => {
  const [preview, setPreview] = useState(currentImage || null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      e.target.value = "";
      return;
    }


    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);


    onImageChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemoveImage();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-64 h-48 object-cover rounded-lg border border-gray-600"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-64 h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <PhotoIcon className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-400">Click to upload an image</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG, or WEBP (max 2MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
      )}
    </div>
  );
};

const AdminAbout = () => {
  const [aboutData, setAboutData] = useState({
    founded_year: "",
    club_name: "",
    member_count: "",
    activities: "",
    image_url: "",
    features: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    featureId: null,
    featureTitle: ""
  });

  const iconComponents = {
    RocketLaunchIcon: <RocketLaunchIcon className="h-10 w-10 text-blue-400" />,
    CodeBracketIcon: <CodeBracketIcon className="h-10 w-10 text-blue-400" />,
    UsersIcon: <UsersIcon className="h-10 w-10 text-blue-400" />,
    LightBulbIcon: <LightBulbIcon className="h-10 w-10 text-blue-400" />
  };

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
  const response = await axios.get(`${API_BASE_URL}/about`);
        setAboutData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load about page content");
        setLoading(false);
        console.error(err);
      }
    };
    fetchAboutData();
  }, []);

  const handleStoryUpdate = (e) => {
    const { name, value } = e.target;
    setAboutData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (file) => {
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setAboutData(prev => ({ ...prev, image_url: "" }));
  };

  const handleFeatureEdit = (feature) => {
    setEditingFeature({...feature});
    setIsEditing(true);
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedFeatures;
      
      if (editingFeature.id) {
        // Update existing feature
        updatedFeatures = aboutData.features.map(f => 
          f.id === editingFeature.id ? editingFeature : f
        );
      } else {
        // Add new feature with unique ID
        updatedFeatures = [
          ...aboutData.features,
          {
            ...editingFeature,
            id: Date.now().toString()
          }
        ];
      }

      const updatedData = {
        ...aboutData,
        features: updatedFeatures
      };

  const response = await axios.put(`${API_BASE_URL}/about`, updatedData);
      setAboutData(response.data);
      toast.success("Feature saved successfully!");
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update feature");
      toast.error("Failed to save feature");
      console.error(err);
    }
  };

  const handleDeleteClick = (featureId, featureTitle) => {
    setDeleteModal({
      isOpen: true,
      featureId,
      featureTitle
    });
  };

  const handleConfirmDelete = async () => {
    try {
  await axios.delete(`${API_BASE_URL}/about/features/${deleteModal.featureId}`);
  const updatedData = await axios.get(`${API_BASE_URL}/about`);
      setAboutData(updatedData.data);
      toast.success("Feature deleted successfully!");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete feature");
      toast.error("Failed to delete feature");
      console.error(err);
    } finally {
      setDeleteModal({ isOpen: false, featureId: null, featureTitle: "" });
    }
  };

  const handleSaveStory = async () => {
    try {
      setUploading(true);
      
      // If there's a new image file, upload it first
      let imageUrl = aboutData.image_url;
      
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/about/upload-image`, 
          formData, 
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        
        imageUrl = uploadResponse.data.imageUrl;
      }
      
      // Update the about data with the new image URL
      const updatedData = {
        ...aboutData,
        image_url: imageUrl
      };
      
  const response = await axios.put(`${API_BASE_URL}/about`, updatedData);
      setAboutData(response.data);
      toast.success("About page updated successfully!");
      setImageFile(null);
      setError(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update story");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-6 bg-red-900/20 border border-red-700 rounded-lg max-w-md">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition-colors"
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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
            Manage About Page
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Edit the content that appears on the About page
        </p>
      </motion.div>

      {/* Our Story Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Our Story</h2>
          <button
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={handleSaveStory}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Founded Year</label>
              <input
                type="text"
                name="founded_year"
                value={aboutData.founded_year}
                onChange={handleStoryUpdate}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Club Name</label>
              <input
                type="text"
                name="club_name"
                value={aboutData.club_name}
                onChange={handleStoryUpdate}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Member Count</label>
              <input
                type="text"
                name="member_count"
                value={aboutData.member_count}
                onChange={handleStoryUpdate}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2">Activities</label>
              <textarea
                name="activities"
                value={aboutData.activities}
                onChange={handleStoryUpdate}
                rows="4"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-gray-400 mb-2">Story Image</label>
            <ImageUpload 
              currentImage={aboutData.image_url} 
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
            />
            <p className="text-sm text-gray-400 text-center mt-2">
              Upload an image that represents your club's story
            </p>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Key Features</h2>
          <button
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            onClick={() => {
              setEditingFeature({
                icon: "RocketLaunchIcon",
                title: "",
                description: ""
              });
              setIsEditing(true);
            }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Feature
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aboutData.features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="bg-gray-700 rounded-xl p-6 border border-gray-600 relative transition-transform"
            >
              <div className="flex justify-between items-start">
                <div className="text-blue-400 mb-4">
                  {iconComponents[feature.icon]}
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    onClick={() => handleFeatureEdit(feature)}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    onClick={() => handleDeleteClick(feature.id, feature.title)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Feature Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md"
          >
            <form onSubmit={handleFeatureSubmit}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingFeature.id ? "Edit Feature" : "Add New Feature"}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Icon</label>
                  <select
                    value={editingFeature.icon}
                    onChange={(e) => setEditingFeature({...editingFeature, icon: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  >
                    <option value="RocketLaunchIcon">Rocket</option>
                    <option value="CodeBracketIcon">Code</option>
                    <option value="UsersIcon">Users</option>
                    <option value="LightBulbIcon">Light Bulb</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingFeature.title}
                    onChange={(e) => setEditingFeature({...editingFeature, title: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 mb-2">Description</label>
                  <textarea
                    value={editingFeature.description}
                    onChange={(e) => setEditingFeature({...editingFeature, description: e.target.value})}
                    rows="3"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium hover:bg-gray-600 transition-colors"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, featureId: null, featureTitle: "" })}
        onConfirm={handleConfirmDelete}
        message={`Are you sure you want to delete the "${deleteModal.featureTitle}" feature? This action cannot be undone.`}
      />
    </div>
  );
};

export default AdminAbout;