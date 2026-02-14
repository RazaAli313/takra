 import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/outline";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState("");
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Dummy contact info when API is not available
  const DUMMY_CONTACT = {
    email: "contact@taakra.com",
    phone: "+92 42 123 4567",
    address: "PUCIT New Campus,\nUniversity of the Punjab,\nLahore, Pakistan"
  };

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/contact`);
        setContactInfo(response.data);
        setLoading(false);
      } catch (err) {
        setContactInfo(DUMMY_CONTACT);
        setError(null);
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
  await axios.post(`${API_BASE_URL}/contact/messages`, formData);
      setStatus("✅ Message sent successfully!");
      
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus("❌ Failed to send message. Please try again.");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  // Use dummy data if contactInfo is empty (e.g. API failed but we set DUMMY in catch)
  const displayContact = contactInfo?.email || contactInfo?.phone || contactInfo?.address
    ? contactInfo
    : DUMMY_CONTACT;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Contact Us
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            Have questions or want to collaborate? Reach out to our team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg"
          >
            <motion.h2 variants={itemVariants} className="text-2xl font-bold mb-6">Send us a message</motion.h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block mb-2 text-slate-600">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 transition-colors"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block mb-2 text-slate-600">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 transition-colors"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <label htmlFor="message" className="block mb-2 text-slate-600">Your Message</label>
                <textarea
                  id="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 transition-colors"
                ></textarea>
              </motion.div>
              <motion.button
                variants={itemVariants}
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 py-3 rounded-lg font-semibold text-white transition-all duration-150 shadow-sm"
              >
                Send Message
              </motion.button>
              {status && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center ${status.includes("✅") ? "text-green-400" : "text-red-400"}`}
                >
                  {status}
                </motion.p>
              )}
            </form>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <motion.div 
              variants={itemVariants}
              className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="text-sky-500 mr-4 mt-1">
                    <EnvelopeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-600">Email</h3>
                    <p className="text-slate-600">{displayContact.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-sky-500 mr-4 mt-1">
                    <PhoneIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-600">Phone</h3>
                    <p className="text-slate-600">{displayContact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="text-sky-500 mr-4 mt-1">
                    <MapPinIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-600">Address</h3>
                    <p className="text-slate-600 whitespace-pre-line">{displayContact.address}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 h-64 shadow-lg"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3402.589422330943!2d74.265199!3d31.4804787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391903ccac08143b%3A0x9b0637753efd261e!2sPUCIT-New%20Campus!5e0!3m2!1sen!2s!4v1750514492353!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="PUCIT New Campus Location"
              ></iframe>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;