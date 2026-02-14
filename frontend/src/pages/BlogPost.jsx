import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ClockIcon, 
  UserIcon, 
  ArrowLeftIcon,
  CalendarIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import axios from "axios";  
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from "../utils/api";
import toast from "react-hot-toast";
import BlogCommentOTPModal from "../components/BlogCommentOTPModal";

// const API_URL = "http://localhost:8000/api";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
  const response = await fetch(`${API_BASE_URL}/posts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch post');
        const data = await response.json();
          setPost(data);
        setLikes(data.likes || 0);
        
        // Check like status
        const likeStatusRes = await fetch(`${API_BASE_URL}/posts/${id}/like/status`);
        if (likeStatusRes.ok) {
          const likeStatus = await likeStatusRes.json();
          setHasLiked(likeStatus.liked || false);
          setLikes(likeStatus.likes || 0);
        }
        
        // Fetch related posts (by same author)
        const relatedResponse = await fetch(`${API_BASE_URL}/posts?author=${encodeURIComponent(data.author)}&limit=3`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedPosts(relatedData.filter(p => p.id !== id));
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
    // fetch comments
    const fetchComments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/posts/${id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) { console.warn('Failed to fetch comments', err); }
    };
    fetchComments();
  }, [id]);
    const handleSubscribe = async () => {
      if (!email) {
        toast.error("Please enter a valid email.");
        return;
      }
      try {
  await axios.post(`${API_BASE_URL}/subscribe`, {
          email,
          subscribed_at: new Date().toISOString(),
        });
        toast.success("🎉 Subscribed successfully!");
        setEmail("");
      } catch (err) {
        toast.error("❌ Subscription failed. Please try again.");
      }
    };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20 flex justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => navigate('/blogs')}
            className="absolute top-0 right-0 px-2 py-1 text-sm"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl mb-4">Blog post not found</p>
          <button
            onClick={() => navigate('/blogs')}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  // Format date for display
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleOTPVerified = (token) => {
    setVerificationToken(token);
    setShowOTPModal(false);
    toast.success("Email verified! You can now post your comment.");
  };

  const submitComment = async () => {
    if (!commentName || !commentEmail || !commentBody || !verificationToken) {
      toast.error('Please verify your email first');
      return;
    }
    
    setIsSubmittingComment(true);
    try {
      const fd = new FormData();
      fd.append('name', commentName);
      fd.append('email', commentEmail);
      fd.append('body', commentBody);
      fd.append('verification_token', verificationToken);
      
      const res = await fetch(`${API_BASE_URL}/posts/${id}/comments`, {
        method: 'POST',
        body: fd
      });
      
      if (res.ok) {
        toast.success('Comment is set to pending ,subjected to approval by FDC Admin!');
        setCommentName('');
        setCommentEmail('');
        setCommentBody('');
        setVerificationToken(null);
        
        // Refresh comments
        const listRes = await fetch(`${API_BASE_URL}/posts/${id}/comments`);
        if (listRes.ok) {
          const data = await listRes.json();
          setComments(data);
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.detail || 'Failed to add comment');
        if (errorData.detail?.includes('verification')) {
          setVerificationToken(null);
          setShowOTPModal(true);
        }
      }
    } catch (err) {
      console.error('Add comment failed', err);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white">
      {/* Header */}
      <header className="pt-12 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            className="text-center mb-8"
          >
            <div className="flex justify-center items-center text-sm text-gray-400 mb-4">
              <div className="flex items-center mr-6">
                <UserIcon className="h-4 w-4 mr-1" />
                {post.author}
              </div>
              <div className="flex items-center mr-6">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formattedDate}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {post.read_time}
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
                {post.title}
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{post.excerpt}</p>
          </motion.div>
        </div>
      </header>

      {/* Featured Image */}
      {post.image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12"
        >
          <div className="rounded-xl overflow-hidden shadow-2xl">
            <img
              src={`${post.image_url}`}
              alt={post.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        </motion.div>
      )}

      {/* Blog Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="prose prose-invert prose-lg max-w-none"
          >
            {/* In a real app, you would render your actual blog content here */}
            {/* For demo purposes, we'll use some placeholder text */}
            <p className="text-gray-300 mb-6">
              Welcome to this in-depth exploration of our topic. This blog post will take you through 
              all the important aspects you need to know.
            </p>
            {/* Render markdown if content appears to be markdown; fallback to raw HTML for older posts */}
            {post.content && (post.content.trim().startsWith('<') && post.content.includes('>')) ? (
              <div className="text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="text-gray-300 mb-6 prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
              </div>
            )}
            {/* Like button */}
            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={async () => {
                  if (isLiking || hasLiked) return;
                  setIsLiking(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/posts/${id}/like`, { method: 'POST' });
                    if (res.ok) {
                      const d = await res.json();
                      setLikes(d.likes);
                      setHasLiked(true);
                      toast.success('❤️ Liked!');
                    } else {
                      const errorData = await res.json();
                      if (errorData.detail?.includes('already liked')) {
                        setHasLiked(true);
                        toast.error('You have already liked this post');
                      } else {
                        toast.error('Failed to like');
                      }
                    }
                  } catch (err) { 
                    console.error('Like failed', err); 
                    toast.error('Failed to like'); 
                  } finally {
                    setIsLiking(false);
                  }
                }}
                disabled={isLiking || hasLiked}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${
                  hasLiked
                    ? 'bg-gray-600 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <HeartIcon className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
                {likes} {likes === 1 ? 'Like' : 'Likes'} {hasLiked && '(You liked this)'}
              </button>
            </div>

            {/* Comments Section */}
            <div className="mt-12 border-t border-gray-700 pt-8">
              <h3 className="text-2xl font-bold mb-6 text-teal-400">Comments ({comments.length})</h3>
              
              {/* Comments List */}
              <div className="space-y-4 mb-8">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-semibold text-teal-400">{c.name}</div>
                        <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-2 text-gray-200 whitespace-pre-wrap">{c.body}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Form */}
              <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-teal-400">Add a comment</h4>
                <p className="text-sm text-gray-400 mb-4">Email verification required to post comments</p>
                <div className="space-y-4">
                  <input
                    value={commentName}
                    onChange={e => setCommentName(e.target.value)}
                    placeholder="Your name *"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <input
                    type="email"
                    value={commentEmail}
                    onChange={e => setCommentEmail(e.target.value)}
                    placeholder="Your email *"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <textarea
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    placeholder="Write your comment *"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows={4}
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        if (!commentName || !commentEmail || !commentBody) {
                          return toast.error('Please fill all fields');
                        }
                        // Validate email format
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(commentEmail)) {
                          return toast.error('Please enter a valid email address');
                        }
                        // Check if email is verified
                        if (!verificationToken) {
                          // Show OTP modal
                          setShowOTPModal(true);
                          return;
                        }
                        // Submit comment
                        await submitComment();
                      }}
                      disabled={isSubmittingComment}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          
          </motion.article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-20"
            >
              {/* <h3 className="text-2xl font-bold mb-6 text-teal-400">More from {post.author}</h3> */}
              <h3 className="text-2xl font-bold mb-6 text-teal-400">More from Taakra 2026</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <motion.div
                    key={relatedPost.id}
                    whileHover={{ y: -5 }}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 cursor-pointer"
                    onClick={() => navigate(`/blogs/${relatedPost.id}`)}
                  >
                    {relatedPost.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={`${relatedPost.image_url}`}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-bold mb-2 line-clamp-2">{relatedPost.title}</h4>
                      <div className="flex items-center text-sm text-gray-400">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {relatedPost.read_time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer CTA */}
      <div className="bg-gray-800 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Enjoyed this article?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter to get more content like this delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 flex-grow"
              onChange={(e)=>setEmail(e.target.value)}
              
            />
            <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium" onClick={handleSubscribe} >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <BlogCommentOTPModal
          email={commentEmail}
          postId={id}
          onVerified={handleOTPVerified}
          onClose={() => setShowOTPModal(false)}
        />
      )}
    </div>
  );
};

export default BlogPost;