import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import toast from 'react-hot-toast';
import { 
  ClockIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhotoIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  XCircleIcon,
  LockOpenIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RejectionReasonModal from "../../components/RejectionReasonModal";
import { API_BASE_URL } from "../../utils/api";

const AdminBlogs = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    id: null,
    title: "",
    excerpt: "",
    author: "",
    read_time: "",
    content: "",
    image: null,
    previewImage: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, submissionId: null });
  const [registrationStatus, setRegistrationStatus] = useState({ open: true });
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
  const response = await fetch(`${API_BASE_URL}/posts`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setBlogPosts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/submissions?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Failed to fetch submissions', err);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/blog-submissions/status`, {
        headers,
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrationStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch registration status', err);
    }
  };

  const toggleRegistrationStatus = async () => {
    try {
      setIsTogglingStatus(true);
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/blog-submissions/status`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ open: !registrationStatus.open })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegistrationStatus(data);
        toast.success(`Blog submissions ${data.open ? 'opened' : 'closed'} successfully`);
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update registration status');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  useEffect(() => { 
    fetchPosts(); 
    fetchSubmissions();
    fetchRegistrationStatus();
  }, []);

  const fetchPostComments = async (postId) => {
    if (!postId) return;
    setLoadingComments(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/comments/all`, {
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setPostComments(data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewComments = (post) => {
    setSelectedPost(post);
    fetchPostComments(post.id);
  };

  const handleApproveComment = async (postId, commentId) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/comments/${commentId}/approve`, {
        method: 'PUT',
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to approve comment');
      toast.success('Comment approved');
      fetchPostComments(postId);
    } catch (err) {
      console.error('Failed to approve comment', err);
      toast.error('Failed to approve comment');
    }
  };

  const handleRejectComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to reject and delete this comment?')) return;
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/comments/${commentId}/reject`, {
        method: 'PUT',
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to reject comment');
      toast.success('Comment rejected');
      fetchPostComments(postId);
    } catch (err) {
      console.error('Failed to reject comment', err);
      toast.error('Failed to reject comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1] 
        || localStorage.getItem('adminAuthToken');
      
      const headers = {};
      if (token) {
        headers['adminAuthToken'] = token;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      toast.success('Comment deleted');
      fetchPostComments(postId);
    } catch (err) {
      console.error('Failed to delete comment', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleDelete = async (id) => {
    try {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`, { 
        method: 'DELETE' 
      });
      if (!response.ok) throw new Error('Failed to delete post');
      setSuccessMessage('Post deleted successfully');
      toast.success('Post deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPosts();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleEdit = (post) => {
    setCurrentPost({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      read_time: post.read_time,
      content: post.content,
      image: null,
      previewImage: post.image_url ? post.image_url : null
    });
    setIsEditing(true);
  
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPost(prev => ({
          ...prev,
          image: file,
          previewImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentPost.title || !currentPost.content) {
      setError('Title and content are required');
      return;
    
    }

    try {
      setError(null);
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('title', currentPost.title);
      formData.append('excerpt', currentPost.excerpt);
      formData.append('author', currentPost.author);
      formData.append('read_time', currentPost.read_time);
      // content is HTML from ReactQuill
      formData.append('content', currentPost.content || '');
      
      if (currentPost.image) {
        formData.append('image', currentPost.image);
      }

      const url = currentPost.id 
        ? `${API_BASE_URL}/posts/${currentPost.id}`
        : `${API_BASE_URL}/posts`;
      
      const method = currentPost.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      
      setSuccessMessage(`Post ${currentPost.id ? 'updated' : 'created'} successfully`);
      toast.success(`Post ${currentPost.id ? 'updated' : 'created'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPosts();
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
            Manage Blog Posts
          </span>
        </h1>
      </motion.div>

      {/* Registration Status Toggle and Submissions Toggle */}
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRegistrationStatus}
            disabled={isTogglingStatus}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              registrationStatus.open
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {registrationStatus.open ? (
              <>
                <LockOpenIcon className="h-5 w-5" />
                Submissions Open
              </>
            ) : (
              <>
                <LockClosedIcon className="h-5 w-5" />
                Submissions Closed
              </>
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSubmissions(!showSubmissions)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showSubmissions
                ? "bg-teal-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {showSubmissions ? "Hide" : "Show"} Submissions ({submissions.length} pending)
          </motion.button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium"
          onClick={() => {
            setCurrentPost({
              id: null,
              title: "",
              excerpt: "",
              author: "",
              read_time: "",
              content: "",
              image: null,
              previewImage: null
            });
            setIsEditing(true);
          }}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Blog Post
        </motion.button>
      </div>

      {/* Submissions Section */}
      {showSubmissions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 text-teal-400">Pending Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-400">No pending submissions</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                >
                  <h3 className="font-bold mb-2 line-clamp-2">{submission.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">By: {submission.author}</p>
                  <p className="text-xs text-gray-500 mb-4">{submission.email}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white flex items-center justify-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to approve this submission? It will be published immediately.')) return;
                          const response = await fetch(`${API_BASE_URL}/submissions/${submission.id}/approve`, {
                            method: 'PUT'
                          });
                          if (response.ok) {
                            toast.success('Submission approved!');
                            await fetchSubmissions();
                            await fetchPosts();
                            if (selectedSubmission?.id === submission.id) {
                              setSelectedSubmission(null);
                            }
                          } else {
                            const errorData = await response.json();
                            toast.error(errorData.detail || 'Failed to approve');
                          }
                        }}
                        className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectionModal({ isOpen: true, submissionId: submission.id })}
                        className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </motion.div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {Array.isArray(blogPosts) && blogPosts.map((post) => (
          <motion.div
            key={post.id}
            whileHover={{ y: -5 }}
            className="bg-gray-700 rounded-xl p-6 border border-gray-600"
          >
            {post.image_url && (
              <div className="h-48 overflow-hidden mb-4 rounded-lg">
                <img 
                  src={`${post.image_url}`}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{post.title}</h3>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => handleEdit(post)}
                >
                  <PencilIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-red-400"
                  onClick={() => handleDelete(post.id)}
                >
                  <TrashIcon className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {post.author}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {post.read_time}
                </div>
                <div className="flex items-center text-pink-400">
                  <HeartIcon className="h-4 w-4 mr-1" />
                  {post.likes || 0}
                </div>
              </div>
              <button
                onClick={() => handleViewComments(post)}
                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
                title="View Comments"
              >
                <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                Comments
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4">
              {currentPost.id ? "Edit Blog Post" : "Add New Blog Post"}
            </h3>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Title*</label>
                <input
                  type="text"
                  value={currentPost.title}
                  onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Excerpt</label>
                <textarea
                  value={currentPost.excerpt}
                  onChange={(e) => setCurrentPost({...currentPost, excerpt: e.target.value})}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Content* (Markdown)</label>
                <div className="bg-gray-700 rounded-lg p-2">
                  <MDEditor
                    value={currentPost.content}
                    onChange={(val) => setCurrentPost({...currentPost, content: val || ''})}
                    height={300}
                    preview="edit"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Author</label>
                  <input
                    type="text"
                    value={currentPost.author}
                    onChange={(e) => setCurrentPost({...currentPost, author: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Read Time</label>
                  <input
                    type="text"
                    value={currentPost.read_time}
                    onChange={(e) => setCurrentPost({...currentPost, read_time: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 5 min read"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Blog Image</label>
                <div className="flex flex-col items-center">
                  <label className="w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center">
                    {currentPost.previewImage ? (
                      <img 
                        src={currentPost.previewImage} 
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
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium disabled:opacity-50"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Comments Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Comments for: {selectedPost.title}
              </h3>
              <button
                onClick={() => {
                  setSelectedPost(null);
                  setPostComments([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loadingComments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
              </div>
            ) : postComments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {postComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border ${
                      comment.approved
                        ? 'bg-green-900/20 border-green-700/50'
                        : 'bg-yellow-900/20 border-yellow-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-white">{comment.name}</div>
                        <div className="text-sm text-gray-400">{comment.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(comment.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {comment.approved ? (
                          <span className="px-2 py-1 bg-green-700/50 text-green-300 text-xs rounded">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-700/50 text-yellow-300 text-xs rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-200 mt-2 whitespace-pre-wrap">{comment.body}</div>
                    <div className="flex gap-2 mt-3">
                      {!comment.approved && (
                        <button
                          onClick={() => handleApproveComment(selectedPost.id, comment.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white transition-colors"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComment(selectedPost.id, comment.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Submission Preview Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold">{selectedSubmission.title}</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {selectedSubmission.image_url && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={selectedSubmission.image_url}
                  alt={selectedSubmission.title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm">Author</label>
                <p className="text-white font-medium">{selectedSubmission.author}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Email</label>
                <p className="text-white">{selectedSubmission.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Read Time</label>
                <p className="text-white">{selectedSubmission.read_time}</p>
              </div>
              {selectedSubmission.excerpt && (
                <div>
                  <label className="text-gray-400 text-sm">Excerpt</label>
                  <p className="text-white">{selectedSubmission.excerpt}</p>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-sm">Content</label>
                <div className="mt-2 prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedSubmission.content || ''}
                  </ReactMarkdown>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Submitted At</label>
                <p className="text-white">
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t border-gray-700">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRejectionModal({ isOpen: true, submissionId: selectedSubmission.id })}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium flex items-center"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Reject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (!confirm('Are you sure you want to approve this blog submission? It will be published immediately.')) return;
                  const response = await fetch(`${API_BASE_URL}/submissions/${selectedSubmission.id}/approve`, {
                    method: 'PUT'
                  });
                  if (response.ok) {
                    toast.success('Blog submission approved and published!');
                    await fetchSubmissions();
                    await fetchPosts();
                    setSelectedSubmission(null);
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.detail || 'Failed to approve');
                  }
                }}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium flex items-center"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Approve & Publish
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, submissionId: null })}
        onConfirm={async (reason) => {
          const { submissionId } = rejectionModal;
          if (!submissionId) return;

          try {
            const formData = new FormData();
            if (reason) {
              formData.append('reason', reason);
            }
            const response = await fetch(`${API_BASE_URL}/submissions/${submissionId}/reject`, {
              method: 'PUT',
              body: formData
            });
            if (response.ok) {
              toast.success('Submission rejected');
              await fetchSubmissions();
              if (selectedSubmission?.id === submissionId) {
                setSelectedSubmission(null);
              }
              setRejectionModal({ isOpen: false, submissionId: null });
            } else {
              const errorData = await response.json();
              toast.error(errorData.detail || 'Failed to reject');
            }
          } catch (err) {
            toast.error(err.message || 'Failed to reject submission');
          }
        }}
        title="Reject Blog Submission"
      />
    </div>
  );
};

export default AdminBlogs;