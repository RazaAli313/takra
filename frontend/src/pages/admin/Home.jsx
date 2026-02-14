import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowUpIcon, TrashIcon, PhotoIcon, VideoCameraIcon, PencilIcon, XMarkIcon, MegaphoneIcon } from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../../utils/api";

const AdminHome = () => {
  const [contentType, setContentType] = useState("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Banner state
  const [banners, setBanners] = useState([]);
  const [bannerText, setBannerText] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isBannerEditMode, setIsBannerEditMode] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);

  // Use API_BASE_URL from utils/api
  // console.log(API_BASE_URL)

  // Fetch existing content
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
  const response = await fetch(`${API_BASE_URL}/content`);
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error("Error fetching content:", error);
        setErrorMessage("Failed to load content. Please check if the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [API_BASE_URL
    
  ]);

  // Fetch existing banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/banner/all`);
        if (!response.ok) {
          throw new Error('Failed to fetch banners');
        }
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, [API_BASE_URL]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Please select an image file (JPEG, PNG, GIF, etc.)");
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Image size must be less than 5MB");
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage("");
    }
  };

  // Upload image to server
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
  const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Image upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    // Validate inputs
    if (!title.trim() || !description.trim()) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    if (contentType === "video" && !url.trim()) {
      setErrorMessage("Please provide a YouTube URL");
      return;
    }

    if (contentType === "image" && !imageFile && !url.trim() && !isEditMode) {
      setErrorMessage("Please either upload an image or provide an image URL");
      return;
    }

    try {
      let finalUrl = url;
      
      // If it's an image and a file was uploaded, upload it first
      if (contentType === "image" && imageFile) {
        setUploadProgress(0);
        finalUrl = await uploadImage(imageFile);
      } else if (isEditMode && contentType === "image" && !imageFile && !url.trim()) {
        // If editing image and no new file or URL provided, keep existing URL
        finalUrl = editingItem?.url || "";
      } else if (isEditMode && !finalUrl.trim() && editingItem?.url) {
        // If editing and no URL provided, keep existing URL
        finalUrl = editingItem.url;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("type", contentType);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      // Always include URL - backend will update it if provided
      if (finalUrl) {
        formData.append("url", finalUrl);
      }

      let response;
      if (isEditMode && editingItem) {
        // Update existing content
        response = await fetch(`${API_BASE_URL}/content/${editingItem.id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // Create new content
        response = await fetch(`${API_BASE_URL}/content`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'add'} content`);
      }

      const result = await response.json();
      
      setSuccessMessage(`Content ${isEditMode ? 'updated' : 'added'} successfully!`);
      
      // Reset form
      setTitle("");
      setDescription("");
      setUrl("");
      setImageFile(null);
      setImagePreview("");
      setUploadProgress(0);
      setIsEditMode(false);
      setEditingItem(null);
      
      // Refresh content list
      const updatedResponse = await fetch(`${API_BASE_URL}/content`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setContent(updatedData);
      }
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsEditMode(true);
    setContentType(item.type);
    setTitle(item.title);
    setDescription(item.description);
    setUrl(item.url);
    setImageFile(null);
    setImagePreview(item.type === "image" ? item.url : "");
    setErrorMessage("");
    setSuccessMessage("");
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setUrl("");
    setImageFile(null);
    setImagePreview("");
    setContentType("video");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleDelete = (id) => {
  toast((t) => (
    <div>
      <p className="mb-2">Are you sure you want to delete this item?</p>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              const response = await fetch(`${API_BASE_URL}/content/${id}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to delete content");
              }

              const result = await response.json();
              if (result.success) {
                setContent(content.filter((item) => item.id !== id));
                toast.success("Content deleted successfully!");
              }
            } catch (error) {
              toast.error(error.message || "Failed to delete content");
            }
          }}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  ));
};


  // Extract YouTube video ID from URL
  const getYouTubeThumbnail = (url) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) 
        ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` 
        : null;
    } catch (error) {
      return null;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Banner handlers
  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    if (!bannerText.trim()) {
      setErrorMessage("Banner text is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("text", bannerText.trim());
      if (bannerLink.trim()) {
        formData.append("link", bannerLink.trim());
      }
      formData.append("is_active", bannerIsActive);

      setBannerLoading(true);
      let response;
      if (isBannerEditMode && editingBanner) {
        response = await fetch(`${API_BASE_URL}/banner/${editingBanner.id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/banner`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${isBannerEditMode ? 'update' : 'create'} banner`);
      }

      setSuccessMessage(`Banner ${isBannerEditMode ? 'updated' : 'created'} successfully!`);
      
      // Reset form
      setBannerText("");
      setBannerLink("");
      setBannerIsActive(true);
      setIsBannerEditMode(false);
      setEditingBanner(null);
      
      // Refresh banners list
      const updatedResponse = await fetch(`${API_BASE_URL}/banner/all`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setBanners(updatedData);
      }
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setBannerLoading(false);
    }
  };

  const handleBannerEdit = (banner) => {
    setEditingBanner(banner);
    setIsBannerEditMode(true);
    setBannerText(banner.text);
    setBannerLink(banner.link || "");
    setBannerIsActive(banner.is_active);
    setErrorMessage("");
    setSuccessMessage("");
    
    // Scroll to banner form
    document.getElementById('banner-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBannerCancelEdit = () => {
    setIsBannerEditMode(false);
    setEditingBanner(null);
    setBannerText("");
    setBannerLink("");
    setBannerIsActive(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleBannerDelete = (id) => {
    toast((t) => (
      <div>
        <p className="mb-2">Are you sure you want to delete this banner?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`${API_BASE_URL}/banner/${id}`, {
                  method: "DELETE",
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.detail || "Failed to delete banner");
                }

                setBanners(banners.filter((banner) => banner.id !== id));
                toast.success("Banner deleted successfully!");
              } catch (error) {
                toast.error(error.message || "Failed to delete banner");
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-slate-200 text-slate-800 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const handleToggleBannerActive = async (banner) => {
    try {
      const formData = new FormData();
      formData.append("is_active", !banner.is_active);

      const response = await fetch(`${API_BASE_URL}/banner/${banner.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update banner");
      }

      // Refresh banners list
      const updatedResponse = await fetch(`${API_BASE_URL}/banner/all`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setBanners(updatedData);
        toast.success(`Banner ${!banner.is_active ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update banner");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-8 border border-slate-200"
        >
          <h2 className="text-4xl font-bold mb-8 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Taakra 2026 Admin
            </span>
          </h2>
          
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-sky-50 text-sky-700 rounded-lg border border-sky-200 flex items-center justify-between"
            >
              <div className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">Editing: {editingItem?.title}</p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="text-sky-600 hover:text-sky-700 transition-colors"
                title="Cancel editing"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}
          
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setContentType("video")}
                className={`px-6 py-3 text-md font-medium rounded-l-lg transition-all flex items-center ${
                  contentType === "video"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <VideoCameraIcon className="h-5 w-5 mr-2" />
                YouTube Video
              </button>
              <button
                type="button"
                onClick={() => setContentType("image")}
                className={`px-6 py-3 text-md font-medium rounded-r-lg transition-all flex items-center ${
                  contentType === "image"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Image
              </button>
            </div>
          </div>

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mb-12">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Enter title"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Enter description"
                required
              />
            </div>

            {contentType === "video" ? (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-slate-600 mb-2">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="https://youtube.com/... or https://youtu.be/..."
                  required
                />
                {url && getYouTubeThumbnail(url) && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500 mb-2">Preview:</p>
                    <img 
                      src={getYouTubeThumbnail(url)} 
                      alt="YouTube thumbnail" 
                      className="w-32 h-20 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="image-upload" className="block text-sm font-medium text-slate-600 mb-2">
                    Upload Image *
                  </label>
                  <div className="flex items-center space-x-4">
                    <label htmlFor="image-upload" className="cursor-pointer bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-white hover:bg-slate-200 transition-colors">
                      <PhotoIcon className="h-5 w-5 inline mr-2" />
                      Choose Image
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-16 h-12 object-cover rounded-lg border border-slate-200"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Max file size: 5MB</p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-sm text-slate-500">OR</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="image-url" className="block text-sm font-medium text-slate-600 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              {isEditMode && (
                <motion.button
                  type="button"
                  onClick={handleCancelEdit}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-slate-200 text-white font-medium rounded-lg shadow-lg hover:bg-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-100"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-cyan-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (isEditMode ? "Updating..." : "Adding...") 
                  : (isEditMode 
                      ? `Update ${contentType === "video" ? "Video" : "Image"}` 
                      : `Add ${contentType === "video" ? "Video" : "Image"}`
                    )
                }
              </motion.button>
            </div>
          </form>

          <div className="border-t border-slate-200 pt-8">
            <h3 className="text-2xl font-bold mb-6 text-sky-500">
              Existing Content ({content.length})
            </h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <PhotoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No content available. Add some using the form above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {content.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200"
                  >
                    <div className="relative">
                      {item.type === "video" ? (
                        <img
                          src={getYouTubeThumbnail(item.url) || "/placeholder-thumbnail.jpg"}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-thumbnail.jpg";
                          }}
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.jpg";
                          }}
                        />
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          item.type === "video" 
                            ? "bg-sky-100 text-sky-700" 
                            : "bg-sky-100 text-sky-700"
                        }`}>
                          {item.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-bold line-clamp-1">{item.title}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                            title="Edit"
                            disabled={loading}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                            title="Delete"
                            disabled={loading}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                      
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>{formatDate(item.date)}</span>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sky-500 hover:text-sky-600 flex items-center"
                        >
                          View <ArrowUpIcon className="h-3 w-3 ml-1 transform rotate-45" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Banner Management Section */}
          <div id="banner-section" className="border-t border-slate-200 pt-8 mt-12">
            <div className="flex items-center gap-3 mb-6">
              <MegaphoneIcon className="h-7 w-7 text-yellow-400" />
              <h3 className="text-2xl font-bold text-yellow-400">
                Header Banner Management
              </h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-6">
              Manage the header banner that appears at the top of the website. Only one banner can be active at a time.
            </p>

            {isBannerEditMode && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-yellow-900 bg-opacity-50 text-yellow-300 rounded-lg border border-yellow-700 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <PencilIcon className="h-5 w-5 mr-2" />
                  <p className="text-sm font-medium">Editing banner</p>
                </div>
                <button
                  onClick={handleBannerCancelEdit}
                  className="text-yellow-300 hover:text-yellow-200 transition-colors"
                  title="Cancel editing"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            <form onSubmit={handleBannerSubmit} className="space-y-6 mb-8 bg-white/50 p-6 rounded-lg border border-slate-200">
              <div>
                <label htmlFor="banner-text" className="block text-sm font-medium text-slate-600 mb-2">
                  Banner Text * <span className="text-slate-500 text-xs">(Breaking news, event updates, etc.)</span>
                </label>
                <input
                  type="text"
                  id="banner-text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="e.g., Breaking: New Event Registration Now Open!"
                  required
                />
              </div>

              <div>
                <label htmlFor="banner-link" className="block text-sm font-medium text-slate-600 mb-2">
                  Link (Optional) <span className="text-slate-500 text-xs">(URL to redirect when banner is clicked)</span>
                </label>
                <input
                  type="url"
                  id="banner-link"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="https://example.com/event"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={bannerIsActive}
                  onChange={(e) => setBannerIsActive(e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-slate-200 rounded bg-slate-100"
                />
                <label htmlFor="banner-active" className="ml-2 block text-sm text-slate-600">
                  Activate this banner (will deactivate others)
                </label>
              </div>

              <div className="flex justify-end gap-3">
                {isBannerEditMode && (
                  <motion.button
                    type="button"
                    onClick={handleBannerCancelEdit}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 bg-slate-200 text-white font-medium rounded-lg shadow-lg hover:bg-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-100"
                  >
                    Cancel
                  </motion.button>
                )}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={bannerLoading}
                  className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 text-white font-medium rounded-lg shadow-lg hover:shadow-yellow-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bannerLoading 
                    ? (isBannerEditMode ? "Updating..." : "Creating...") 
                    : (isBannerEditMode ? "Update Banner" : "Create Banner")
                  }
                </motion.button>
              </div>
            </form>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-lg font-bold mb-4 text-slate-600">
                Existing Banners ({banners.length})
              </h4>
              
              {banners.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MegaphoneIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No banners created yet. Create one using the form above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white rounded-lg p-4 border ${
                        banner.is_active ? 'border-yellow-500 bg-yellow-900/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              banner.is_active 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(banner.created_at)}
                            </span>
                          </div>
                          <p className="text-white font-medium mb-1">{banner.text}</p>
                          {banner.link && (
                            <a 
                              href={banner.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-500 hover:text-cyan-300 text-sm"
                            >
                              {banner.link}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleToggleBannerActive(banner)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              banner.is_active
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                            title={banner.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {banner.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleBannerEdit(banner)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleBannerDelete(banner.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminHome;