import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon, PhotoIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { uploadProfileImage } from "../utils/cloudinaryUploader";

const Profile = () => {
  const navigate = useNavigate();
  const user = useQuery(api.user.current);
  const profile = useQuery(api.user.getProfile);
  const updateProfileMutation = useMutation(api.user.updateProfile);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const name = profile?.displayName ?? user?.name ?? user?.email ?? "";
    setDisplayName(name);
  }, [profile?.displayName, user?.name, user?.email]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProfileImage(file);
      await updateProfileMutation({ imageUrl: url });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileMutation({ displayName: displayName.trim() || undefined });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (user === null) {
    navigate("/signin", { replace: true });
    return null;
  }

  const imageUrl = profile?.imageUrl;
  const name = profile?.displayName || user.name || user.email || "User";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
            Profile
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-full overflow-hidden border-4 border-sky-100 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile"
                    className="w-28 h-28 object-cover"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center text-slate-400">
                    <UserCircleIcon className="w-20 h-20" />
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 p-1.5 bg-sky-500 rounded-full text-white shadow">
                <PhotoIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">Click photo to upload (JPG, PNG, WEBP)</p>
          </div>

          {/* Display name */}
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800"
                placeholder="Your name"
              />
            </div>
            <div className="text-sm text-slate-500">
              Email: <span className="text-slate-700">{user.email}</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
