import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import HallOfFame from './pages/HallofFame';
import Blogs from './pages/Blogs';
import Events from './pages/Events';
import Competitions from './pages/Competitions';
import CompetitionsCalendar from './pages/CompetitionsCalendar';
import CompetitionDetail from './pages/CompetitionDetail';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import TeamMemberProfile from './pages/TeamMemberProfile';
import JoinTeam from './pages/JoinTeam';
import Delegation from './pages/Delegation';
import CogentLabsRegistration from './pages/CogentLabsRegistration';
import FAQ from './pages/FAQ';
import Jobs from './pages/Jobs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatAssistant from './components/ChatAssistant';
import AdminLayout from './layouts/AdminLayout';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAbout from './pages/admin/About';
import AdminContact from './pages/admin/Contact';
import AdminEvents from './pages/admin/Events';
import AdminCategories from './pages/admin/Categories';
import AdminSupportMembers from './pages/admin/SupportMembers';
import AdminTeam from './pages/admin/Team';
import AdminRegistrations from './pages/admin/Registrations';
import AdminBlogs from './pages/admin/Blogs';
import AdminDelegations from './pages/admin/Delegations';
import AdminCogentLabsRegistrations from './pages/admin/CogentLabsRegistrations';
import CogentLabsLogin from './pages/admin/CogentLabsLogin';
import CogentLabsVerifyOtp from './pages/admin/CogentLabsVerifyOtp';
import BlogPost from './pages/BlogPost';
import AdminHome from './pages/admin/Home';
import AdminHallOfFame from './pages/admin/HallOfFame';
import AdminMessages from './pages/admin/Messages';
import AdminChat from './pages/admin/Chat';
import ChatAdmin from './pages/ChatAdmin';
import UserSignUp from './pages/UserSignUp';
import UserSignIn from './pages/UserSignIn';
import AdminFAQ from './pages/admin/FAQ';
import AdminJobs from './pages/admin/Jobs';
import Login from './pages/admin/Login';
import FakeErrorPage from './pages/FakeErrorPage';
import OTPVerification from './pages/admin/auth/VerifyOtp';
import PrivacyPolicy from './components/policies/privacyPolicy';
import TermsAndConditions from './components/policies/terms';
import './index.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useConvexAuth } from 'convex/react';
import FakeLogin from './pages/FakeLogin';
import axios from 'axios';
import { API_BASE_URL } from "./utils/api";
import React from 'react';

import AdminPositions from './pages/admin/Positions';
import BlogApply from './pages/BlogApply';
import BlogSubmissions from './pages/admin/BlogSubmissions';
import BlogAdminLogin from './pages/admin/BlogAdminLogin';
import BlogAdminVerifyOtp from './pages/admin/BlogAdminVerifyOtp';

// Member Portal imports
import MemberLogin from './pages/member/MemberLogin';
import MemberVerifyOtp from './pages/member/MemberVerifyOtp';
import MemberSetPassword from './pages/member/MemberSetPassword';
import MemberForgotPassword from './pages/member/MemberForgotPassword';
import MemberResetPassword from './pages/member/MemberResetPassword';
import MemberDashboard from './pages/member/MemberDashboard';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  // useNavigate is already imported and used in AppWrapper, so only declare here if not already in scope
  const navigate = useNavigate();
  const isAuthenticated = Cookies.get('adminAuthToken');
  const isMasterToken = Cookies.get('masterAuthToken');
  const isOtpVerified = Cookies.get('otpVerified');
  const [isValid, setIsValid] = React.useState(null);
  const [isOtpValid, setIsOtpValid] = React.useState(null);

  React.useEffect(() => {
    const verifyTokensAndOtp = async () => {
      if (!isAuthenticated || !isMasterToken) {
        setIsValid(false);
        return;
      }
      try {
        // Verify both tokens via backend
  const res = await axios.post(`${API_BASE_URL}/auth/verifyTokens`, {}, {
          headers: {
            'adminAuthToken': isAuthenticated,
            'masterAuthToken': isMasterToken
          }
        });
        if (res.data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
          return;
        }
        // Only allow if otpVerified cookie is set to true
        if (isOtpVerified === "true") {
          setIsOtpValid(true);
        } else {
          setIsOtpValid(false);
        }
      } catch (err) {
      
        setIsValid(false);
        setIsOtpValid(false);
      }
    };
    verifyTokensAndOtp();
  }, [isAuthenticated, isMasterToken]);

  React.useEffect(() => {
    if (isOtpValid === false) {
      navigate("/verifyotp");
    }
  }, [isOtpValid, navigate]);

  if (isValid === false) {
    return <Navigate to="/fake/login" replace />;
  }
  if (isValid === null || isOtpValid === null || isOtpValid === false) {
    return null; // or loading spinner
  }
  return children;
};

// Protected Route Component for Cogent Labs Admin
const CogentLabsProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = Cookies.get('cogentLabsAuthToken') || localStorage.getItem('cogentLabsAuthToken');
  const isOtpVerified = Cookies.get('cogentLabsOtpVerified');
  const [isValid, setIsValid] = React.useState(null);
  const [isOtpValid, setIsOtpValid] = React.useState(null);

  React.useEffect(() => {
    const verifyToken = async () => {
      if (!isAuthenticated) {
        setIsValid(false);
        return;
      }
      try {
        const res = await axios.post(`${API_BASE_URL}/cogentlabs/auth/verify`, {}, {
          headers: {
            'cogentLabsAuthToken': isAuthenticated
          },
          withCredentials: true
        });
        if (res.data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        setIsValid(false);
      }
    };
    verifyToken();
  }, [isAuthenticated]);

  React.useEffect(() => {
    // Check OTP verification
    if (isOtpVerified === "true") {
      setIsOtpValid(true);
    } else {
      setIsOtpValid(false);
    }
  }, [isOtpVerified]);

  React.useEffect(() => {
    if (isValid === false) {
      navigate("/manage/registrations/login");
    } else if (isValid === true && isOtpValid === false) {
      navigate("/manage/registrations/verify-otp");
    }
  }, [isValid, isOtpValid, navigate]);

  if (isValid === false) {
    return <Navigate to="/manage/registrations/login" replace />;
  }
  if (isValid === null || isOtpValid === null || isOtpValid === false) {
    return null; // or loading spinner
  }
  return children;
};

// Protected Route Component for Blog Admin
const BlogAdminProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = Cookies.get('blogAdminAuthToken') || localStorage.getItem('blogAdminAuthToken');
  const isOtpVerified = Cookies.get('blogAdminOtpVerified');
  const [isValid, setIsValid] = React.useState(null);
  const [isOtpValid, setIsOtpValid] = React.useState(null);

  React.useEffect(() => {
    const verifyToken = async () => {
      if (!isAuthenticated) {
        setIsValid(false);
        return;
      }
      try {
        const res = await axios.post(`${API_BASE_URL}/blogadmin/auth/verify`, {}, {
          headers: {
            'blogAdminAuthToken': isAuthenticated
          },
          withCredentials: true
        });
        if (res.data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        setIsValid(false);
      }
    };
    verifyToken();
  }, [isAuthenticated]);

  React.useEffect(() => {
    // Check OTP verification
    if (isOtpVerified === "true") {
      setIsOtpValid(true);
    } else {
      setIsOtpValid(false);
    }
  }, [isOtpVerified]);

  React.useEffect(() => {
    if (isValid === false) {
      navigate("/manage/blogs/login");
    } else if (isValid === true && isOtpValid === false) {
      navigate("/manage/blogs/verify-otp");
    }
  }, [isValid, isOtpValid, navigate]);

  if (isValid === false) {
    return <Navigate to="/manage/blogs/login" replace />;
  }
  if (isValid === null || isOtpValid === null || isOtpValid === false) {
    return null; // or loading spinner
  }
  return children;
};

// Protected Route Component for Member Portal
const MemberProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = Cookies.get('memberAuthToken') || localStorage.getItem('memberAuthToken');
  const [isValid, setIsValid] = React.useState(null);

  React.useEffect(() => {
    const verifyToken = async () => {
      if (!isAuthenticated) {
        setIsValid(false);
        return;
      }
      try {
        const res = await axios.post(`${API_BASE_URL}/member/auth/verify`, {}, {
          headers: {
            'memberAuthToken': isAuthenticated
          },
          withCredentials: true
        });
        if (res.data.valid) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        setIsValid(false);
      }
    };
    verifyToken();
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (isValid === false) {
      navigate("/member/login");
    }
  }, [isValid, navigate]);

  if (isValid === false) {
    return <Navigate to="/member/login" replace />;
  }
  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return children;
};

// Admin Settings Page
import AdminSettings from './pages/admin/Settings';

function AppWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();

  // If Google sent the OAuth code to localhost by mistake (wrong redirect URI), strip ?code= so URL is clean
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("code") && !isAuthenticated) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, isAuthenticated, navigate]);

  return (
    
    <div className="flex flex-col min-h-screen w-screen overflow-x-hidden bg-slate-50">
      {/* Don't show Navbar on fake routes, admin, or member portal */}
      {!location.pathname.startsWith('/fake') && !location.pathname.startsWith('/error') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/member') && <Navbar />}
      
      {/* Chat Assistant - Show on public pages only */}
      {!location.pathname.startsWith('/fake') && !location.pathname.startsWith('/error') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/member') && <ChatAssistant />}

      <main className="flex-grow w-full">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/apply" element={<BlogApply />} />
            <Route path="/blogs/:id" element={<BlogPost />} />
            <Route path="/events" element={<Events />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/competitions/calendar" element={<CompetitionsCalendar />} />
            <Route path="/competitions/:id" element={<CompetitionDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team" element={<Team />} />
            <Route path="/team/:id" element={<TeamMemberProfile />} />
            <Route path="/join" element={<JoinTeam />} />
            <Route path="/delegation" element={<Delegation />} />
            <Route path="/register" element={<CogentLabsRegistration />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/chat" element={<ChatAdmin />} />
            <Route path="/signup" element={<UserSignUp />} />
            <Route path="/signin" element={<UserSignIn />} />
            <Route exact path="/error" element={<FakeErrorPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
           <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route exact path="/verifyotp" element={<OTPVerification />} />
            <Route path="/admin/login" element={<FakeLogin/>} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/login" replace />} />
              <Route path="chat" element={<AdminChat />} />
            </Route>
            
            {/* Cogent Labs Admin Routes */}
            <Route path="/manage/registrations/login" element={<CogentLabsLogin />} />
            <Route path="/manage/registrations/verify-otp" element={<CogentLabsVerifyOtp />} />
            
            {/* Blog Admin Routes */}
            <Route path="/manage/blogs/login" element={<BlogAdminLogin />} />
            <Route path="/manage/blogs/verify-otp" element={<BlogAdminVerifyOtp />} />

            {/* Member Portal Routes */}
            <Route path="/member/login" element={<MemberLogin />} />
            <Route path="/member/verify-otp" element={<MemberVerifyOtp />} />
            <Route path="/member/set-password" element={<MemberSetPassword />} />
            <Route path="/member/forgot-password" element={<MemberForgotPassword />} />
            <Route path="/member/reset-password" element={<MemberResetPassword />} />
            <Route path="/member/dashboard" element={
              <MemberProtectedRoute>
                <MemberDashboard />
              </MemberProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/fake/login" element={<Login />} />
            
            <Route path="/fake" element={
              <ProtectedRoute>
                <AdminAuthProvider>
                  <AdminLayout />
                </AdminAuthProvider>
              </ProtectedRoute>
            }>
              {/* <Route index element={<AdminDashboard />} /> */}
              <Route index element={<AdminDashboard />} />
              
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="about" element={<AdminAbout />} />
              <Route path="contact" element={<AdminContact />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="support-members" element={<AdminSupportMembers />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="delegations" element={<AdminDelegations />} />
              <Route path="manage/registrations" element={<AdminCogentLabsRegistrations />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="positions" element={<AdminPositions />} />
              <Route path="hall-of-fame" element={<AdminHallOfFame />} />
              <Route path="faq" element={<AdminFAQ />} />
              <Route path="jobs" element={<AdminJobs />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            </Route>
            
            {/* Separate protected route for /manage/registrations */}
            <Route path="/manage/registrations" element={
              <CogentLabsProtectedRoute>
                <AdminCogentLabsRegistrations />
              </CogentLabsProtectedRoute>
            } />
            
            {/* Blog Admin Panel - Separate from main admin */}
            <Route path="/manage/blogs" element={
              <BlogAdminProtectedRoute>
                <BlogSubmissions />
              </BlogAdminProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
      </main>
      
      {/* Don't show Footer on fake routes, admin, member portal, or chat */}
      {!location.pathname.startsWith('/fake') && !location.pathname.startsWith('/error') && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/member') && location.pathname !== '/chat' && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
        <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: { background: "#333", color: "#fff" }
        }}
      />
    </Router>
  );
}

export default App;