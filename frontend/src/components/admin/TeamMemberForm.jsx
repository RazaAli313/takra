import { motion } from "framer-motion";
import {XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";


const TeamMemberForm = ({ member, type, onSave, onCancel }) => {
  const [formData, setFormData] = useState(member);
  const [socialLinks, setSocialLinks] = useState(member.socials);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSocialChange = (e) => {
    setSocialLinks({
      ...socialLinks,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      socials: socialLinks
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {member.id ? "Edit" : "Add"} {type === "team" ? "Team Member" : "Advisor"}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Role</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-700">
            <h4 className="text-lg font-semibold mb-3">Social Links</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1 text-sm">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={socialLinks.linkedin || ""}
                  onChange={handleSocialChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {type === "team" && (
                <>
                  <div>
                    <label className="block text-gray-400 mb-1 text-sm">GitHub</label>
                    <input
                      type="url"
                      name="github"
                      value={socialLinks.github || ""}
                      onChange={handleSocialChange}
                      placeholder="https://github.com/username"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 text-sm">Twitter</label>
                    <input
                      type="url"
                      name="twitter"
                      value={socialLinks.twitter || ""}
                      onChange={handleSocialChange}
                      placeholder="https://twitter.com/username"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium"
              onClick={onCancel}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-medium"
            >
              Save
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TeamMemberForm;