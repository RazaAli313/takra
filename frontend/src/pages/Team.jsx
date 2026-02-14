import { API_BASE_URL } from "../utils/api";
import { motion } from "framer-motion";
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from "react-hot-toast";


const TeamMember = ({ name, role, roles_by_tenure, tenure, image_url, socials, bio }) => {
  // Get role for this specific tenure
  const getRoleForTenure = (rolesByTenure, tenure, fallbackRole) => {
    if (rolesByTenure && tenure && rolesByTenure[tenure]) {
      return rolesByTenure[tenure];
    }
    // Backward compatibility: use role field
    return fallbackRole || 'Member';
  };
  
  const displayRole = getRoleForTenure(roles_by_tenure, tenure, role);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl p-6 border border-slate-200 hover:border-sky-200 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-sky-50"
    >
      {/* Profile Image */}
      <div className="flex justify-center mb-4">
        {image_url ? (
          <img 
            src={image_url} 
            alt={name} 
            className="h-28 w-28 rounded-full object-cover border-4 border-sky-200 shadow-lg"
          />
        ) : (
          <div className="h-28 w-28 rounded-full bg-sky-100 flex items-center justify-center border-4 border-sky-200 shadow-lg">
            <svg 
              className="h-14 w-14 text-sky-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
              />
            </svg>
          </div>
        )}
      </div>

      {/* Name and Role */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-slate-800 mb-1">{name}</h3>
        <p className="text-sky-600 text-base font-bold">{displayRole}</p>
      </div>

      {/* Bio */}
      {bio && (
        <div className="flex-grow mb-4 min-h-[3.5rem]">
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 text-center">
            {bio}
          </p>
        </div>
      )}
      
      {/* Spacer if no bio */}
      {!bio && <div className="flex-grow"></div>}

      {/* Social Links */}
      <div className="flex justify-center items-center space-x-4 pt-4 border-t border-slate-200">
        {socials?.linkedin && (
          <a 
            href={socials.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-600 transition-colors duration-200 p-2 rounded-full hover:bg-sky-100"
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        )}
        {socials?.github && (
          <a 
            href={socials.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-sky-600 transition-colors duration-200 p-2 rounded-full hover:bg-sky-100"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        )}
        {socials?.portfolio && (
          <a 
            href={socials.portfolio} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-sky-600 transition-colors duration-200 p-2 rounded-full hover:bg-sky-100"
            aria-label="Portfolio"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 3h8a5 5 0 0 1 0 10H8v8H4V3zm4 4v2h4a1 1 0 1 0 0-2H8z"/>
            </svg>
          </a>
        )}
        {socials?.twitter && (
          <a 
            href={socials.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-600 transition-colors duration-200 p-2 rounded-full hover:bg-sky-100"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  );
};

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [advisors, setAdvisors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTenure, setSelectedTenure] = useState('All');
  const navigate = useNavigate();

  // Get current tenure
  const getCurrentTenure = () => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${currentYear + 1}`;
  };

  // Group team members by tenure (support multiple tenures per member)
  const groupByTenure = (members) => {
    const grouped = {};
    members.forEach(member => {
      // Support both old format (string) and new format (array)
      const tenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : ['Unknown']);
      
      tenures.forEach(tenure => {
        const tenureKey = tenure || 'Unknown';
        if (!grouped[tenureKey]) {
          grouped[tenureKey] = [];
        }
        // Only add member if not already in this tenure group (avoid duplicates)
        if (!grouped[tenureKey].some(m => m.id === member.id)) {
          grouped[tenureKey].push(member);
        }
      });
    });
    
    // Sort members within each tenure by order_by_tenure (same as admin panel)
    Object.keys(grouped).forEach(tenureKey => {
      grouped[tenureKey].sort((a, b) => {
        const orderA = a.order_by_tenure?.[tenureKey] ?? a.order ?? 9999;
        const orderB = b.order_by_tenure?.[tenureKey] ?? b.order ?? 9999;
        return orderA - orderB;
      });
    });
    
    // Sort tenures in descending order (newest first)
    const sortedTenures = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return b.localeCompare(a);
    });
    
    return { grouped, sortedTenures };
  };

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // console.log("API_BASE_URL:", API_BASE_URL);
        const [teamRes, advisorsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/members/?member_type=team`),
            axios.get(`${API_BASE_URL}/members/?member_type=advisor`)
        ]);

        // Ensure order_by_tenure exists for all members (initialize if missing)
        const teamData = Array.isArray(teamRes.data) ? teamRes.data.map(member => ({
          ...member,
          order_by_tenure: member.order_by_tenure || {}
        })) : [];
        
        const advisorsData = Array.isArray(advisorsRes.data) ? advisorsRes.data.map(member => ({
          ...member,
          order_by_tenure: member.order_by_tenure || {}
        })) : [];

        setTeamMembers(teamData);
        setAdvisors(advisorsData);
      } catch (error) {
        console.error('Error fetching team data:', error);
        setTeamMembers([]);
        setAdvisors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Our Team
            </span>
          </h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Meet the passionate individuals driving our tech community forward.
          </p>
          
          {/* Tenure Filter Tags */}
          {(() => {
            const { sortedTenures } = groupByTenure(teamMembers);
            const currentTenure = getCurrentTenure();
            
            // Show tags if there are any team members (even if only one tenure)
            if (teamMembers.length === 0) return null;
            
            return (
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {sortedTenures.length > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTenure('All')}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      selectedTenure === 'All'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-sky-50 border border-slate-200'
                    }`}
                  >
                    All Teams
                  </motion.button>
                )}
                {sortedTenures.map((tenure) => (
                  <motion.button
                    key={tenure}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTenure(tenure)}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      selectedTenure === tenure
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-600 hover:bg-sky-50 border border-slate-200'
                    }`}
                  >
                    {tenure === 'Unknown' ? 'Other' : tenure}
                    {tenure === currentTenure && tenure !== 'Unknown' && (
                      <span className="ml-2 text-xs opacity-75">(Current)</span>
                    )}
                  </motion.button>
                ))}
              </div>
            );
          })()}
        </motion.div>

        {(() => {
          const { grouped, sortedTenures } = groupByTenure(teamMembers);
          const filteredTenures = selectedTenure === 'All' 
            ? sortedTenures 
            : sortedTenures.filter(t => t === selectedTenure);
          
          return filteredTenures.map((tenure, index) => (
            <motion.div
              key={tenure}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="mb-20"
            >
              <div className="flex items-center justify-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">
                    {tenure === 'Unknown' ? 'Team Members' : `${tenure} Team`}
                  </span>
                </h2>
                {tenure !== 'Unknown' && (
                  <span className="ml-4 px-4 py-1 bg-blue-500/20 border border-blue-400 rounded-full text-sm text-blue-300">
                    {tenure}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {grouped[tenure].map((member) => (
                  <Link key={member.id} to={`/team/${member.id}?tenure=${encodeURIComponent(tenure)}`} className="h-full block">
                    <TeamMember 
                      name={member.name} 
                      role={member.role} 
                      roles_by_tenure={member.roles_by_tenure}
                      tenure={tenure}
                      image_url={member.image_url}
                      socials={member.socials}
                      bio={member.bio}
                    />
                  </Link>
                ))}
              </div>
            </motion.div>
          ));
        })()}

        {advisors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-2xl font-bold mb-8 text-center">Advisors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {advisors.map(advisor => {
                // For advisors, get the first tenure or use null
                const advisorTenures = Array.isArray(advisor.tenure) ? advisor.tenure : (advisor.tenure ? [advisor.tenure] : []);
                const displayTenure = advisorTenures.length > 0 ? advisorTenures[0] : null;
                return (
                  <Link key={advisor.id} to={`/team/${advisor.id}${displayTenure ? `?tenure=${encodeURIComponent(displayTenure)}` : ''}`} className="h-full block">
                    <TeamMember 
                      name={advisor.name} 
                      role={advisor.role} 
                      roles_by_tenure={advisor.roles_by_tenure}
                      tenure={displayTenure}
                      image_url={advisor.image_url}
                      socials={advisor.socials}
                    />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-6">Join Our Team</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-6">
            Applications for our next term's leadership team will open soon. Follow us on social media for updates.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full font-semibold shadow-lg"
            onClick={async () => {
              try {
                const res = await axios.get(`${API_BASE_URL}/registrations/status`);
                if (res.data && res.data.open) {
                  navigate('/join');
                } else {
                  toast.error("Applications opening soon!");
                }
              } catch (err) {
                console.error('Failed to check registrations status', err);
                toast.error("Applications opening soon!");
              }
            }}
          >
            View Open Positions
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Team;