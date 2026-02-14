import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon, UserGroupIcon, AcademicCapIcon, MapPinIcon } from "@heroicons/react/24/solid";

const CELEBRATION_STORAGE_KEY = "fdc-celebration-modal-seen";

export const shouldShowCelebrationModal = () => {
  if (typeof window === "undefined") return true;
  return !sessionStorage.getItem(CELEBRATION_STORAGE_KEY);
};

export const markCelebrationModalSeen = () => {
  sessionStorage.setItem(CELEBRATION_STORAGE_KEY, "true");
};

const CelebrationModal = ({ isOpen, onClose }) => {
  const handleClose = () => {
    markCelebrationModalSeen();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
          >
            {/* Takra theme - snowy white with icy blue gradient border */}
            <div className="rounded-2xl bg-gradient-to-br from-sky-300 via-blue-400 to-sky-500 p-[2px]">
              <div className="relative rounded-[14px] bg-white/95 backdrop-blur-xl border border-sky-200/80 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400" />

                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="p-8 pt-10 pb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <SparklesIcon className="h-8 w-8 text-amber-400 animate-pulse" />
                    <motion.h2
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-600 to-sky-500 text-center"
                    >
                      Celebrating FCIT Developers Club
                    </motion.h2>
                    <SparklesIcon className="h-8 w-8 text-amber-400 animate-pulse" />
                  </div>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-center text-slate-500 text-sm mb-8">
                    Two years of innovation, community & growth
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 rounded-xl bg-sky-50 border border-sky-200">
                      <span className="block text-2xl md:text-3xl font-bold text-sky-600">2</span>
                      <span className="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Years</span>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="block text-2xl md:text-3xl font-bold text-blue-600">50+</span>
                      <span className="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Members</span>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-sky-50 border border-sky-200">
                      <span className="block text-2xl md:text-3xl font-bold text-sky-600">2</span>
                      <span className="text-xs md:text-sm text-slate-500 uppercase tracking-wider">Chapters</span>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 text-slate-700">
                      <UserGroupIcon className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <p><span className="text-sky-600 font-semibold">From 26 to 50+ members</span> — a thriving community built on passion for tech and collaboration.</p>
                    </div>
                    <div className="flex items-start gap-3 text-slate-700">
                      <MapPinIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <p><span className="text-blue-600 font-semibold">Two chapters</span> — Old Campus & New Campus — expanding our reach and impact.</p>
                    </div>
                    <div className="flex items-start gap-3 text-slate-700">
                      <AcademicCapIcon className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                      <p><span className="text-sky-600 font-semibold">Events & workshops</span> — hackathons, talks, and hands-on sessions that shape the next generation of developers.</p>
                    </div>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="text-center text-slate-500 text-sm">
                    Thank you for being part of this journey. Here's to many more years of building together.
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationModal;
