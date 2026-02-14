import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import axios from 'axios'
import App from './App.jsx'
// import { ThemeProvider } from './contexts/ThemeContext'


axios.defaults.withCredentials = true;

// Optionally set your backend base URL
axios.defaults.baseURL = "http://localhost:8000";
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <ThemeProvider> */}
      <App />
    {/* </ThemeProvider> */}
  </StrictMode>,
)
