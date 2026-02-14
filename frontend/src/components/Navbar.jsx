import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../utils/api';

const NavbarContent = () => {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState(null);
  const [showBanner, setShowBanner] = useState(true);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Competitions", path: "/competitions" },
    { name: "Calendar", path: "/competitions/calendar" },
    { name: "My Dashboard", path: "/dashboard" },
    { name: "About", path: "/about" },
    { name: "Team", path: "/team" },
    { name: "Hall of Fame", path: "/hall-of-fame" },
    { name: "Blogs", path: "/blogs" },
    { name: "FAQ", path: "/faq" },
    { name: "Jobs", path: "/jobs" },
    { name: "Contact", path: "/contact" },
  ];

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/banner`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.is_active) {
            setBanner(data);
          }
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      }
    };
    fetchBanner();
    const interval = setInterval(fetchBanner, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Header Banner - Takra icy accent */}
      <AnimatePresence>
        {banner && showBanner && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-300 to-blue-400 text-slate-800 z-50 shadow-lg border-b border-slate-200/50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="inline-block mr-2">📢</span>
                  {banner.link ? (
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm md:text-base font-medium hover:underline truncate">
                      {banner.text}
                    </a>
                  ) : (
                    <span className="flex-1 text-sm md:text-base font-medium truncate">{banner.text}</span>
                  )}
                </div>
                <button onClick={() => setShowBanner(false)} className="ml-4 p-1 hover:bg-white/30 rounded transition-colors flex-shrink-0" aria-label="Close banner">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar - Takra snowy white */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 z-40 shadow-sm ${banner && showBanner ? 'mt-[42px]' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div whileHover={{ scale: 1.05 }} className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600 flex items-center gap-3">
                Taakra
                <img src="/takra.png" alt="Taakra" className="h-10 w-10 ml-2 rounded-full border-2 border-sky-400 bg-white shadow-sm" />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <motion.div key={item.name} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={item.path}
                    className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none text-slate-700">
                {open ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <motion.div key={item.name} whileTap={{ scale: 0.95 }}>
                  <Link
                    to={item.path}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.nav>
    </>
  );
};

const Navbar = memo(NavbarContent);
export default Navbar;
