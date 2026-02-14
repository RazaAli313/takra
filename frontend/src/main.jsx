import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import axios from 'axios'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App.jsx'
// import { ThemeProvider } from './contexts/ThemeContext'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL ?? '');

axios.defaults.withCredentials = true;

// Optionally set your backend base URL
axios.defaults.baseURL = "http://localhost:8000";
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      {/* <ThemeProvider> */}
        <App />
      {/* </ThemeProvider> */}
    </ConvexProvider>
  </StrictMode>,
)
