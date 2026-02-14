import { API_BASE_URL } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownIcon, XMarkIcon, PlayIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CelebrationModal, { shouldShowCelebrationModal } from "../components/CelebrationModal";

const Home = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [hasBanner, setHasBanner] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const contentSectionRef = useRef(null);

  useEffect(() => {
    setShowCelebrationModal(shouldShowCelebrationModal());
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/content`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data || !Array.isArray(data)) throw new Error('Invalid data format received from API');
        const processedData = data.map(item => {
          const processedItem = {
            id: item.id || Math.random().toString(36).substr(2, 9),
            type: item.type || 'image',
            title: item.title || 'Untitled',
            description: item.description || '',
            url: item.url || '',
            thumbnail: item.thumbnail || '',
            date: item.date || new Date().toISOString().split('T')[0]
          };
          if (processedItem.type === "video" && processedItem.url.includes('youtube.com/watch?v=')) {
            const videoId = processedItem.url.split('v=')[1];
            processedItem.url = `https://www.youtube.com/embed/${videoId.split('&')[0]}`;
          }
          if (!processedItem.thumbnail && processedItem.url.includes('youtube.com/embed/')) {
            const videoId = processedItem.url.split('embed/')[1];
            processedItem.thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
          }
          return processedItem;
        });
        setContent(processedData);
      } catch (err) {
        setError(err.message);
        setContent([{ id: 1, type: "video", title: "Getting Started", description: "Learn.", url: "https://www.youtube.com/embed/dGcsHMXbSOA", thumbnail: "https://i.ytimg.com/vi/dGcsHMXbSOA/maxresdefault.jpg", date: "2023-05-15" }]);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
    const checkBanner = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/banner`);
        if (res.ok) {
          const data = await res.json();
          setHasBanner(data && data.is_active);
        }
      } catch (e) { /* ignore */ }
    };
    checkBanner();
  }, []);

  const openMediaModal = (item) => { setSelectedMedia(item); setShowMediaModal(true); };
  const closeMediaModal = () => { setShowMediaModal(false); setTimeout(() => setSelectedMedia(null), 300); };
  const scrollToContent = () => contentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } };

  if (error && content.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center text-slate-800">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Content</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 ${hasBanner ? 'pt-28' : 'pt-20'}`} style={{ minHeight: '100vh' }}>
      <CelebrationModal isOpen={showCelebrationModal} onClose={() => setShowCelebrationModal(false)} />

      {/* Animated frost/snow background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-sky-300/20"
            initial={{ scale: 0, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
            animate={{ scale: [0, 1, 0], opacity: [0, 0.2, 0] }}
            transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
            style={{ width: Math.random() * 150 + 50, height: Math.random() * 150 + 50 }}
          />
        ))}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik02MCAwSDB2NjBNNjAgMEwwIDYwIiBzdHJva2U9InJnYmEoMT48L3N2Zz4=')] opacity-[0.03]"></div>
      </div>

      {/* Hero */}
      <div className="container mx-auto px-6 py-24 pt-32 flex flex-col items-center justify-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
          <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }} className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600">Taakra 2026</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-slate-600">
            Where innovation meets creativity. Join us in shaping the future of technology.
          </motion.p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="inline-block">
            <button onClick={() => navigate("/team")} className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-300">
              Join Now
            </button>
          </motion.div>
        </motion.div>
        <motion.button animate={{ y: [0, 15, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="mt-24 p-2 rounded-full bg-white/80 border border-slate-200 shadow-sm hover:bg-sky-50 transition-colors" onClick={scrollToContent} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <ArrowDownIcon className="h-10 w-10 text-sky-500" />
        </motion.button>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-16 relative z-10" ref={contentSectionRef}>
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-4xl font-bold mb-12 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600">Latest Content</span>
        </motion.h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div className="rounded-full h-12 w-12 border-2 border-sky-500 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
            {content.map((item) => (
              <motion.div key={item.id} variants={itemVariants} whileHover={{ y: -5 }} className="bg-white rounded-xl overflow-hidden shadow-lg border border-slate-200/80 hover:shadow-sky-100 hover:border-sky-200 transition-all duration-300 group cursor-pointer" onClick={() => openMediaModal(item)}>
                <div className="relative overflow-hidden">
                  {item.type === "video" ? (
                    <div className="relative pt-[56.25%]">
                      <img src={item.thumbnail || `https://i.ytimg.com/vi/${item.url.split('embed/')[1]}/maxresdefault.jpg`} alt={item.title} className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1581276879432-15e50529f34b?w=800&q=80"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <PlayIcon className="h-8 w-8 text-sky-600 ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img src={item.url} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1581276879432-15e50529f34b?w=800&q=80"; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white truncate drop-shadow-lg">{item.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="px-2 py-1 bg-sky-500/90 rounded-md text-xs text-white">{item.type}</span>
                      <span className="text-xs text-slate-200">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-slate-600 line-clamp-2">{item.description}</p>
                  <div className="flex items-center mt-3 text-sky-600 text-sm font-medium">
                    <span>View {item.type === "video" ? "Video" : "Image"}</span>
                    <ArrowDownIcon className="h-4 w-4 ml-1 transform rotate-90" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Media Modal */}
      <AnimatePresence>
        {showMediaModal && selectedMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={closeMediaModal}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] border border-slate-200" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-slate-100 shadow-lg transition-colors" onClick={closeMediaModal}>
                  <XMarkIcon className="h-6 w-6 text-slate-700" />
                </button>
                {selectedMedia.type === "video" ? (
                  <div className="relative pt-[56.25%]">
                    <iframe src={selectedMedia.url} className="absolute top-0 left-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={selectedMedia.title} />
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-hidden">
                    <img src={selectedMedia.url} alt={selectedMedia.title} className="w-full h-full object-contain" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1581276879432-15e50529f34b?w=800&q=80"; }} />
                  </div>
                )}
              </div>
              <div className="p-6 bg-white">
                <h3 className="text-2xl font-bold mb-2 text-slate-800">{selectedMedia.title}</h3>
                <p className="text-slate-600 mb-4">{selectedMedia.description}</p>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full">{selectedMedia.type === "video" ? "Video" : "Image"}</span>
                  <span>{new Date(selectedMedia.date).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center border border-slate-200 shadow-lg">
          <h2 className="text-3xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600">Ready to Innovate With Us?</span>
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-slate-600">Join our community of developers, designers, and innovators to work on exciting projects and enhance your skills.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/team")} className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-sky-200 hover:shadow-sky-300 transition-all duration-300">
            Become a Member
          </motion.button>
        </motion.div>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-slate-500 text-sm">
        <div className="container mx-auto px-6">© {new Date().getFullYear()} Taakra 2026. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Home;
