// AdminLayout.jsx
import {motion} from "framer-motion";
import { Outlet, Link, useLocation,useNavigate } from "react-router-dom";
import { LogOutIcon, SettingsIcon, HomeIcon, FileEditIcon, UsersIcon, CalendarIcon, BookOpenIcon, MailIcon, TrophyIcon, HelpCircleIcon, BriefcaseIcon } from "lucide-react";
// import Navbar from "../components/Navbar";

const AdminLayout = () => {
  const navigate=useNavigate();
  const location = useLocation();
  const onLogout = () => {
  // Remove tokens and verification from cookies for secure logout
  document.cookie = "adminAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "masterAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "otpVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "/admin/login";
    
  }
    const navItems = [
    { name: "Dashboard", path: "/fake/dashboard", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18" />
        <rect x="6" y="10" width="2" height="7" rx="1" />
        <rect x="10" y="6" width="2" height="11" rx="1" />
        <rect x="14" y="3" width="2" height="14" rx="1" />
      </svg>
    ) },
    { name: "Home", path: "/fake/home", icon: <HomeIcon className="h-5 w-5" /> },
    { name: "About", path: "/fake/about", icon: <FileEditIcon className="h-5 w-5" /> },
     { name: "Contact", path: "/fake/contact", icon: <FileEditIcon className="h-5 w-5" /> },
    { name: "Events", path: "/fake/events", icon: <CalendarIcon className="h-5 w-5" /> },
    { name: "Team", path: "/fake/team", icon: <UsersIcon className="h-5 w-5" /> },
    // { name: "Positions", path: "/fake/positions", icon: <FileEditIcon className="h-5 w-5" /> },
    { name: "Hall of Fame", path: "/fake/hall-of-fame", icon: <TrophyIcon className="h-5 w-5" /> },
    { name: "Blogs", path: "/fake/blogs", icon: <BookOpenIcon className="h-5 w-5" /> },
    { name: "FAQ", path: "/fake/faq", icon: <HelpCircleIcon className="h-5 w-5" /> },
    { name: "Jobs", path: "/fake/jobs", icon: <BriefcaseIcon className="h-5 w-5" /> },
    { name: "Team Registrations", path: "/fake/registrations", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6l1 2h2a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1h2l1-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6M9 15h6M9 7h6" />
      </svg>
    ) },
    { name: "Messages", path: "/fake/messages", icon: <MailIcon className="h-5 w-5" /> },
    { name: "Chat", path: "/admin/chat", icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="flex">
        {/* Sidebar */}
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden md:flex flex-col w-64 h-screen fixed bg-gray-800 border-r border-gray-700"
        >
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              FCIT Devs Admin
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              </motion.div>
            ))}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700"
              onClick={() =>navigate("/fake/delegations")}
            >
              <FileEditIcon className="h-5 w-5 mr-3" />
              Delegation
            </motion.button>
          </nav>
          
          <div className="p-4 border-t border-gray-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700"
              onClick={() =>navigate("/fake/settings")}
            >
              <SettingsIcon className="h-5 w-5 mr-3" />
              Settings
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700 mt-2"
            >
              <LogOutIcon className="h-5 w-5 mr-3" />
              Logout
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile sidebar (drawer) */}
        <div className="md:hidden">
          {/* Mobile sidebar toggle and content would go here */}
        </div>

        {/* Main content */}
        <div className="flex-1 md:ml-64">
          {/* <Navbar /> */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;