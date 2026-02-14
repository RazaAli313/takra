import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import toast from "react-hot-toast";
import { API_BASE_URL } from "../utils/api";
import axios from "axios";
import { 
  PhotoIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import BlogSubmissionOTPModal from "../components/BlogSubmissionOTPModal";

const BlogApply = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    author: "",
    read_time: "",
    content: "",
    email: "",
    image: null,
    previewImage: null
  });
  const [errors, setErrors] = useState({});
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check registration status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/submissions/status`);
        setIsRegistrationOpen(response.data.open);
      } catch (err) {
        console.error('Failed to check registration status', err);
        // Default to open if check fails
        setIsRegistrationOpen(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    // Reset verification token if email changes
    if (name === "email" && verificationToken) {
      setVerificationToken(null);
    }
  };

  const handleOTPVerified = (token) => {
    setVerificationToken(token);
    setShowOTPModal(false);
    toast.success("Email verified successfully!");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: "Image size should be less than 2MB"
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          previewImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({
        ...prev,
        image: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }
    if (!formData.author.trim()) {
      newErrors.author = "Author name is required";
    }
    if (!formData.read_time.trim()) {
      newErrors.read_time = "Read time is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    // Check if email is verified
    if (!verificationToken) {
      toast.error("Please verify your email first");
      setShowOTPModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('excerpt', formData.excerpt || '');
      submitFormData.append('author', formData.author);
      submitFormData.append('read_time', formData.read_time);
      submitFormData.append('content', formData.content);
      submitFormData.append('email', formData.email);
      submitFormData.append('verification_token', verificationToken);
      
      if (formData.image) {
        submitFormData.append('image', formData.image);
      }

      const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        body: submitFormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit blog');
      }

      const data = await response.json();
      toast.success("Blog submitted successfully! It will be reviewed by our team.");
      
      // Reset form
      setFormData({
        title: "",
        excerpt: "",
        author: "",
        read_time: "",
        content: "",
        email: "",
        image: null,
        previewImage: null
      });
      setVerificationToken(null);
      
      // Show success message for a bit, then navigate
      setTimeout(() => {
        navigate('/blogs');
      }, 2000);
      
    } catch (err) {
      toast.error(err.message || "Failed to submit blog. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center"
          >
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Blog Submissions Closed</h1>
            <p className="text-gray-300 mb-6">
              Blog submissions are currently closed. Please check back later.
            </p>
            <motion.button
              onClick={() => navigate('/blogs')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700"
            >
              Back to Blogs
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/blogs')}
          className="flex items-center text-teal-400 mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Blogs
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-700 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
                Submit Your Blog
              </span>
            </h1>
            <p className="text-gray-300">
              Share your knowledge and insights with the FCIT Developers Club community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full bg-gray-700 border ${
                  errors.title ? 'border-red-500' : 'border-gray-600'
                } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Enter blog title"
                required
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Brief description of your blog (optional)"
              />
            </div>

            {/* Author and Read Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Author Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-700 border ${
                    errors.author ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Your name"
                  required
                />
                {errors.author && (
                  <p className="text-red-400 text-sm mt-1">{errors.author}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Read Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="read_time"
                  value={formData.read_time}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-700 border ${
                    errors.read_time ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="e.g., 5 min read"
                  required
                />
                {errors.read_time && (
                  <p className="text-red-400 text-sm mt-1">{errors.read_time}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`flex-1 bg-gray-700 border ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="your.email@example.com"
                  required
                />
                {verificationToken ? (
                  <div className="flex items-center px-4 bg-green-600 rounded-lg text-white font-medium">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Verified
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                        toast.error("Please enter a valid email address first");
                        return;
                      }
                      setShowOTPModal(true);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white font-medium whitespace-nowrap transition-colors"
                  >
                    Verify Email
                  </motion.button>
                )}
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
              <p className="text-gray-400 text-sm mt-1">
                {verificationToken 
                  ? "Email verified! You can now submit your blog."
                  : "Please verify your email before submitting. We'll notify you when your blog is reviewed."
                }
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Content <span className="text-red-400">*</span>
              </label>
              <div className="bg-gray-700 rounded-lg">
                <MDEditor
                  value={formData.content}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, content: val || '' }));
                    if (errors.content) {
                      setErrors(prev => ({ ...prev, content: "" }));
                    }
                  }}
                  height={400}
                  preview="edit"
                />
              </div>
              {errors.content && (
                <p className="text-red-400 text-sm mt-1">{errors.content}</p>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Blog Image (Optional)
              </label>
              <div className="flex flex-col items-center">
                <label className="w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center transition-colors">
                  {formData.previewImage ? (
                    <img 
                      src={formData.previewImage} 
                      alt="Preview" 
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Click to upload image</p>
                      <p className="text-xs text-gray-500">(Max 2MB, recommended 1200x800)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              {errors.image && (
                <p className="text-red-400 text-sm mt-1">{errors.image}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/blogs')}
                className="px-6 py-3 bg-gray-700 rounded-lg text-white font-medium hover:bg-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Submit Blog
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <BlogSubmissionOTPModal
          email={formData.email}
          onVerified={handleOTPVerified}
          onClose={() => setShowOTPModal(false)}
        />
      )}
    </div>
  );
};

export default BlogApply;

