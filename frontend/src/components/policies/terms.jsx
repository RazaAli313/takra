import { motion } from "framer-motion";
import { useEffect } from "react";

const TermsAndConditions = () => {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
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
              <h2 className="text-2xl font-bold text-blue-700 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700">By accessing or using the Taakra 2026 website and services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">2. Intellectual Property</h2>
              <p className="text-gray-700">All content on this website, including text, graphics, logos, images, and software, is the property of Taakra 2026 or its content suppliers and is protected by international copyright laws. The compilation of all content on this site is the exclusive property of Taakra 2026.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">3. User Conduct</h2>
              <p className="text-gray-700">You agree not to:</p>
              <ul className="list-disc pl-5 mt-2 text-gray-700">
                <li>Use our services for any illegal purpose</li>
                <li>Post or transmit any material that is defamatory, offensive, or otherwise objectionable</li>
                <li>Attempt to gain unauthorized access to any part of our website or systems</li>
                <li>Interfere with the proper working of our website</li>
                <li>Use any automated means to access our website without our express written permission</li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">4. Account Registration</h2>
              <p className="text-gray-700">To access certain features of our website, you may be required to register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-700">Taakra 2026 shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, our services.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">6. Termination</h2>
              <p className="text-gray-700">We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">7. Governing Law</h2>
              <p className="text-gray-700">These Terms shall be governed and construed in accordance with the laws of Pakistan, without regard to its conflict of law provisions.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700">We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">9. Events and Workshops</h2>
              <p className="text-gray-700">Registration for our events and workshops may be subject to additional terms and conditions. By registering for an event, you agree to abide by those additional terms.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-blue-700 mb-4">10. Contact Information</h2>
              <p className="text-gray-700">If you have any questions about these Terms, please contact us at:</p>
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

export default TermsAndConditions;