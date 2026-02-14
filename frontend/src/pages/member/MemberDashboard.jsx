import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../utils/api";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PhotoIcon,
  LinkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from "@heroicons/react/24/outline";

const MemberDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("bio");

  // Form state
  const [formData, setFormData] = useState({
    bio: "",
    socials: {
      linkedin: "",
      github: "",
      twitter: "",
      portfolio: ""
    },
    skills: [],
    projects: [],
    experience: [],
    education: []
  });

  // Temporary input states
  const [skillInput, setSkillInput] = useState("");
  const [projectTemp, setProjectTemp] = useState({ title: "", description: "", url: "" });
  const [experienceTemp, setExperienceTemp] = useState({ role: "", company: "", period: "", description: "" });
  const [educationTemp, setEducationTemp] = useState({ degree: "", institution: "", period: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("memberAuthToken") || Cookies.get("memberAuthToken");
      if (!token) {
        navigate("/member/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/member/profile`, {
        headers: { memberAuthToken: token }
      });

      setProfile(response.data);
      setFormData({
        bio: response.data.bio || "",
        socials: {
          linkedin: response.data.socials?.linkedin || "",
          github: response.data.socials?.github || "",
          twitter: response.data.socials?.twitter || "",
          portfolio: response.data.socials?.portfolio || ""
        },
        skills: response.data.skills || [],
        projects: response.data.projects || [],
        experience: response.data.experience || [],
        education: response.data.education || []
      });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        handleLogout();
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("memberAuthToken");
    Cookies.remove("memberAuthToken");
    navigate("/member/login");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("memberAuthToken") || Cookies.get("memberAuthToken");
      
      const response = await axios.put(
        `${API_BASE_URL}/member/profile`,
        formData,
        {
          headers: { memberAuthToken: token }
        }
      );

      setProfile(response.data.profile);
      toast.success("Profile updated successfully!");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to save changes";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("memberAuthToken") || Cookies.get("memberAuthToken");
      
      const response = await axios.post(
        `${API_BASE_URL}/member/profile/image`,
        formData,
        {
          headers: {
            memberAuthToken: token,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setProfile(prev => ({ ...prev, image_url: response.data.image_url }));
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error("Failed to upload image");
    }
  };

  // Helper functions for managing arrays
  const addSkill = () => {
    if (!skillInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, skillInput.trim()]
    }));
    setSkillInput("");
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    if (!projectTemp.title.trim()) return;
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { ...projectTemp }]
    }));
    setProjectTemp({ title: "", description: "", url: "" });
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    if (!experienceTemp.role.trim() || !experienceTemp.company.trim()) return;
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { ...experienceTemp }]
    }));
    setExperienceTemp({ role: "", company: "", period: "", description: "" });
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    if (!educationTemp.degree.trim() || !educationTemp.institution.trim()) return;
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { ...educationTemp }]
    }));
    setEducationTemp({ degree: "", institution: "", period: "" });
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "bio", label: "Bio & Socials", icon: DocumentTextIcon },
    { id: "skills", label: "Skills", icon: CodeBracketIcon },
    { id: "projects", label: "Projects", icon: LinkIcon },
    { id: "experience", label: "Experience", icon: BriefcaseIcon },
    { id: "education", label: "Education", icon: AcademicCapIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FDC-Member Portal</h1>
              <p className="text-sm text-gray-400">Welcome, {profile?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/team/${profile?.id}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              <EyeIcon className="h-4 w-4" />
              View Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="text-center">
                {/* Profile Image */}
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 mx-auto">
                    {profile?.image_url ? (
                      <img
                        src={profile.image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-4xl font-bold text-white">
                        {profile?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 p-2 rounded-full cursor-pointer transition">
                    <PhotoIcon className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <h2 className="text-xl font-bold text-white mt-4">{profile?.name}</h2>
                <p className="text-blue-400">
                  {(() => {
                    // Get current role from roles_by_tenure
                    if (profile?.roles_by_tenure && profile?.tenure) {
                      const tenures = Array.isArray(profile.tenure) ? profile.tenure : [profile.tenure];
                      // Sort tenures descending and get the most recent
                      const sortedTenures = [...tenures].sort((a, b) => b.localeCompare(a));
                      const currentTenure = sortedTenures[0];
                      return profile.roles_by_tenure[currentTenure] || profile.role || "Team Member";
                    }
                    return profile?.role || "Team Member";
                  })()}
                </p>
                {profile?.tenure && (
                  <p className="text-sm text-gray-400 mt-1">
                    {(() => {
                      const tenures = Array.isArray(profile.tenure) ? profile.tenure : [profile.tenure];
                      const sortedTenures = [...tenures].sort((a, b) => b.localeCompare(a));
                      return sortedTenures[0];
                    })()}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Member Type</span>
                  <span className="text-white capitalize">{profile?.member_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white text-xs">{profile?.email}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-xl border border-gray-700"
            >
              {/* Tabs */}
              <div className="flex border-b border-gray-700 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Bio & Socials Tab */}
                {activeTab === "bio" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={5}
                        placeholder="Tell us about yourself... (Supports Markdown)"
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={formData.socials.linkedin}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socials: { ...prev.socials, linkedin: e.target.value }
                          }))}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          GitHub URL
                        </label>
                        <input
                          type="url"
                          value={formData.socials.github}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socials: { ...prev.socials, github: e.target.value }
                          }))}
                          placeholder="https://github.com/username"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          value={formData.socials.twitter}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socials: { ...prev.socials, twitter: e.target.value }
                          }))}
                          placeholder="https://twitter.com/username"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Portfolio URL
                        </label>
                        <input
                          type="url"
                          value={formData.socials.portfolio}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            socials: { ...prev.socials, portfolio: e.target.value }
                          }))}
                          placeholder="https://yourportfolio.com"
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Tab */}
                {activeTab === "skills" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill..."
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                      {formData.skills.length === 0 && (
                        <p className="text-gray-500 text-sm">No skills added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === "projects" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={projectTemp.title}
                        onChange={(e) => setProjectTemp(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Project title"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        value={projectTemp.url}
                        onChange={(e) => setProjectTemp(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="Project URL (optional)"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addProject}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                      >
                        Add Project
                      </button>
                    </div>
                    <input
                      type="text"
                      value={projectTemp.description}
                      onChange={(e) => setProjectTemp(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Short description (optional)"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div className="space-y-3 mt-4">
                      {formData.projects.map((project, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{project.title}</h4>
                            {project.description && (
                              <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                            )}
                            {project.url && (
                              <a href={project.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 hover:underline mt-1 inline-block">
                                View Project →
                              </a>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProject(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {formData.projects.length === 0 && (
                        <p className="text-gray-500 text-sm">No projects added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === "experience" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={experienceTemp.role}
                        onChange={(e) => setExperienceTemp(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="Job title / Role"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={experienceTemp.company}
                        onChange={(e) => setExperienceTemp(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company / Organization"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={experienceTemp.period}
                        onChange={(e) => setExperienceTemp(prev => ({ ...prev, period: e.target.value }))}
                        placeholder="Period (e.g., Jan 2023 - Present)"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addExperience}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                      >
                        Add Experience
                      </button>
                    </div>
                    <input
                      type="text"
                      value={experienceTemp.description}
                      onChange={(e) => setExperienceTemp(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="space-y-3 mt-4">
                      {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{exp.role} @ {exp.company}</h4>
                            {exp.period && <p className="text-sm text-gray-400">{exp.period}</p>}
                            {exp.description && <p className="text-sm text-gray-300 mt-1">{exp.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExperience(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {formData.experience.length === 0 && (
                        <p className="text-gray-500 text-sm">No experience added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === "education" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={educationTemp.degree}
                        onChange={(e) => setEducationTemp(prev => ({ ...prev, degree: e.target.value }))}
                        placeholder="Degree / Certification"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={educationTemp.institution}
                        onChange={(e) => setEducationTemp(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="Institution"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={educationTemp.period}
                        onChange={(e) => setEducationTemp(prev => ({ ...prev, period: e.target.value }))}
                        placeholder="Period (e.g., 2020 - 2024)"
                        className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={addEducation}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                      >
                        Add Education
                      </button>
                    </div>

                    <div className="space-y-3 mt-4">
                      {formData.education.map((edu, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{edu.degree}</h4>
                            <p className="text-sm text-gray-400">{edu.institution}</p>
                            {edu.period && <p className="text-sm text-gray-500">{edu.period}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEducation(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      {formData.education.length === 0 && (
                        <p className="text-gray-500 text-sm">No education added yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white ${
                      isSaving
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberDashboard;
