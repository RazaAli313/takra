import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../utils/api";
import { QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/faq`);
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        const data = await response.json();
        setFaqs(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  // Get unique categories
  const categories = ["All", ...new Set(faqs.map(faq => faq.category).filter(Boolean))];

  // Filter FAQs by category
  const filteredFAQs = selectedCategory === "All" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 py-20 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 py-20 flex justify-center items-center">
        <div className="text-center p-8 bg-red-900/50 dark:bg-red-100/50 backdrop-blur-sm rounded-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-400 dark:text-red-600 mb-4">Error Loading FAQs</h2>
          <p className="text-gray-300 dark:text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 dark:from-gray-50 dark:via-purple-50 dark:to-violet-50 text-white dark:text-gray-900 pt-20 pb-16">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <QuestionMarkCircleIcon className="h-12 w-12 text-cyan-400 dark:text-cyan-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 dark:from-cyan-600 dark:via-blue-600 dark:to-purple-600">
                Frequently Asked Questions
              </span>
            </h1>
          </div>
          <p className="text-lg text-gray-300 dark:text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about FCIT Developers Club
          </p>
        </motion.div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setOpenIndex(null);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-cyan-600 text-white dark:bg-cyan-500"
                    : "bg-gray-800/50 dark:bg-gray-200/50 text-gray-300 dark:text-gray-700 hover:bg-gray-700/50 dark:hover:bg-gray-300/50"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        )}

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-400 dark:text-gray-500"
            >
              <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No FAQs found in this category.</p>
            </motion.div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-gray-800/50 dark:bg-white/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 dark:border-gray-300/50"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-700/30 dark:hover:bg-gray-200/30 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    {faq.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-cyan-900/30 dark:bg-cyan-200/30 text-cyan-300 dark:text-cyan-700 rounded">
                        {faq.category}
                      </span>
                    )}
                  </div>
                  {openIndex === index ? (
                    <ChevronUpIcon className="h-5 w-5 text-cyan-400 dark:text-cyan-600 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-cyan-400 dark:text-cyan-600 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4"
                  >
                    <div className="pt-2 text-gray-300 dark:text-gray-700 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Still have questions section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-gray-800/30 dark:bg-white/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 dark:border-gray-300/50 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4 text-white dark:text-gray-900">
              Still have questions?
            </h3>
            <p className="text-gray-300 dark:text-gray-600 mb-6">
              Can't find the answer you're looking for? Please reach out to our friendly team.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-full font-semibold text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
            >
              Contact Us
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;

