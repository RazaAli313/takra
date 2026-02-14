import { motion } from "framer-motion";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600">Last updated: August 30, 2025</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
        >
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">1. Information We Collect</h2>
              <p className="text-gray-700 mb-4">Taakra 2026 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>
              <p className="text-gray-700">We collect information you provide directly to us, including:</p>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                <li>Contact information (name, email address, phone number)</li>
                <li>Account credentials for our platform</li>
                <li>Communications you send to us</li>
                <li>Technical data (IP address, browser type, device information)</li>
                <li>Usage data and analytics</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700">We use the information we collect to:</p>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                <li>Provide, maintain, and improve our services</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Protect the security and integrity of our platform</li>
                <li>Communicate with you about events, workshops, and opportunities</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">3. Data Security</h2>
              <p className="text-gray-700">We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, access controls, and regular security assessments.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">4. Your Rights</h2>
              <p className="text-gray-700">You have the right to:</p>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify or update your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Restrict or object to our processing of your personal data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700">We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">6. Third-Party Services</h2>
              <p className="text-gray-700">We may employ third-party companies and individuals to facilitate our service, provide the service on our behalf, or assist us in analyzing how our service is used. These third parties have access to your personal information only to perform these tasks and are obligated not to disclose or use it for any other purpose.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">7. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">8. Contact Us</h2>
              <p className="text-gray-700">If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700"><span className="font-semibold">Email:</span> contact@taakra2026.com</p>
                <p className="text-gray-700"><span className="font-semibold">Address:</span> Taakra 2026</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;