import { API_BASE_URL } from "../utils/api";
import { useState, useEffect } from "react";
import { ClockIcon, UserIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

// const API_URL = "http://localhost:8000/api";

const Blogs = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      // console.log("API_BASE_URL:", API_BASE_URL);
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

  useEffect(() => {
    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex justify-center items-center">
        <div className="bg-white border border-slate-200 text-slate-800 px-6 py-4 rounded-lg max-w-md text-center shadow-lg">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-3 text-red-500" />
          <h3 className="font-bold text-lg mb-2">Error Loading Content</h3>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchPosts}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg text-white font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-12 mt-12">
      <div className="container mx-auto px-4 ">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Tech Blogs
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Insights, tutorials, and thought leadership from our community.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/blogs/apply')}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium hover:from-green-700 hover:to-teal-700 transition-all"
          >
            Submit Your Blog
          </motion.button>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No blog posts available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 transition-transform duration-200 hover:shadow-xl cursor-pointer"
                onClick={() => navigate(`/blogs/${post.id}`)}
              >
                {post.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center text-sm text-gray-400 mb-3">
                    <div className="flex items-center mr-4">
                      <UserIcon className="h-4 w-4 mr-1" />
                      {post.author || "Unknown Author"}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {post.read_time || "5 min read"}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-300 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex justify-end">
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/blogs/${post.id}`);
                      }}
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;