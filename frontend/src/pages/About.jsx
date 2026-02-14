import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { 
  RocketLaunchIcon, 
  CodeBracketIcon, 
  UsersIcon, 
  LightBulbIcon 
} from "@heroicons/react/24/outline";

// Animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "easeOut",
      duration: 0.5
    }
  }
};

const About = () => {
  const [aboutData, setAboutData] = useState({
    founded_year: "2024",
    club_name: "",
    member_count: "",
    activities: "",
    image_url: "",
    features: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const iconComponents = {
    RocketLaunchIcon: <RocketLaunchIcon className="h-10 w-10" />,
    CodeBracketIcon: <CodeBracketIcon className="h-10 w-10" />,
    UsersIcon: <UsersIcon className="h-10 w-10" />,
    LightBulbIcon: <LightBulbIcon className="h-10 w-10" />
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-20">
      <div className="container mx-auto px-6">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
              About Us
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            Empowering the next generation of tech leaders and innovators.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-300 mb-6">
              Founded in <b>{aboutData.founded_year}</b>, <b>{aboutData.club_name}</b> has grown from a small group of passionate students to a thriving community of over <b>{aboutData.member_count}</b> members. We started with a simple mission: to create a space where technology enthusiasts could learn, collaborate, and innovate together.
            </p>
            <p className="text-gray-300">
              Today, we organize <b>{aboutData.activities}</b> that have helped our members secure internships at top tech companies and launch successful startups.
            </p>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 h-96"
          >
            {aboutData.image_url ? (
              <img 
                src={aboutData.image_url} 
                alt="Our club" 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <div className="text-center p-6">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">No image uploaded yet</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What We Offer
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the opportunities and experiences that make our club unique
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {Array.isArray(aboutData.features) && aboutData.features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 transition-transform"
            >
              <div className="text-blue-400 mb-4">
                {iconComponents[feature.icon]}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default About;