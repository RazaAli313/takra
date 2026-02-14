import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const BioPage = ({ type }) => {
  const { email } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const endpoint = type === "advisor" ? `/advisors/${email}` : `/team-members/${email}`;
        const response = await axios.get(`${API_URL}${endpoint}`);
        setProfile(response.data);
      } catch (error) {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [email, type]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  if (!profile) {
    return <div className="text-center text-red-500 mt-16">Profile not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto my-16 bg-gray-900 rounded-xl shadow-lg p-8 border border-purple-700">
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-purple-700 flex items-center justify-center text-3xl text-white font-bold mb-4">
          {profile.name[0]}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{profile.name}</h2>
        <p className="text-purple-400 font-medium mb-1">{type === "advisor" ? "Advisor" : "Team Member"}</p>
      </div>
      <div className="space-y-3 text-gray-300">
        <div><span className="font-semibold text-purple-400">Email:</span> {profile.email}</div>
        <div><span className="font-semibold text-purple-400">Phone:</span> {profile.phone}</div>
        <div><span className="font-semibold text-purple-400">University:</span> {profile.university_name}</div>
        <div><span className="font-semibold text-purple-400">Roll No:</span> {profile.university_roll_no}</div>
        <div><span className="font-semibold text-purple-400">Batch:</span> {profile.batch}</div>
        {profile.bio && (
          <div><span className="font-semibold text-purple-400">Bio:</span> {profile.bio}</div>
        )}
      </div>
    </div>
  );
};

export default BioPage;
