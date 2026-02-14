// FakeErrorPage.js
import { m } from 'framer-motion';
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from "../utils/api";

const FakeErrorPage = () => {
  const [masterAuthToken, setMasterAuthToken] = useState("");

  useEffect(() => {
    const fetchMasterAuthToken = async () => {
  const response = await axios.post(`${API_BASE_URL}/auth/getToken`);
      setMasterAuthToken(response.data.token);
    }
     fetchMasterAuthToken()
  },[])
  const redirectToAdmin = () => {
   
  localStorage.setItem("masterAuthToken", masterAuthToken);
  // Set masterAuthToken in cookies for consistency with App.jsx
  document.cookie = `masterAuthToken=${masterAuthToken}; path=/;`;
  window.location.href = "/fake";
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'M') {
      // Show admin button or redirect directly
    
      redirectToAdmin();
    }

    
    if (e.key === 'F12') {
      e.preventDefault();
      alert('Access denied');
    }
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h1 style={styles.errorTitle}>This site can't be reached</h1>
        <div style={styles.errorMessage}>
          <p><strong>fcit-developers.club</strong> took too long to respond.</p>
          <p>Try:</p>
          <ul style={styles.errorList}>
            <li>Checking the connection</li>
            <li>Checking the proxy and the firewall</li>
            <li>Running Windows Network Diagnostics</li>
          </ul>
          <p style={styles.errorCode}>ERR_CONNECTION_TIMED_OUT</p>
        </div>
        <div style={styles.errorButtons}>
          <button style={styles.primaryButton} onClick={() => window.location.reload()}>
            Reload
          </button>
          <button style={styles.secondaryButton} onClick={() => alert('No additional details available')}>
            Details
          </button>
        </div>
      </div>
      
      {/* Hidden admin access area */}
      <div 
        style={styles.hiddenAdminLink} 
        onClick={redirectToAdmin}
        title="Admin Access"
      />
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#70757a',
    fontFamily: 'Arial, sans-serif'
  },
  errorContainer: {
    maxWidth: '650px',
    padding: '20px'
  },
  errorIcon: {
    fontSize: '20px',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#3c4043',
    fontWeight: '400'
  },
  errorMessage: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '25px'
  },
  errorList: {
    paddingLeft: '20px',
    marginTop: '10px'
  },
  errorCode: {
    marginTop: '10px'
  },
  errorButtons: {
    display: 'flex',
    gap: '10px'
  },
  primaryButton: {
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#1a73e8',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  hiddenAdminLink: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    cursor: 'pointer',
    opacity: '0.01',
    zIndex: 100
  }
};

export default FakeErrorPage;