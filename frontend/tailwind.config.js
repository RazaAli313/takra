/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4682B4',
        // Takra Theme - White Snowy
        takra: {
          snow: '#F8FAFC',      // Off-white snow
          frost: '#F1F5F9',     // Light frost
          ice: '#E2E8F0',       // Ice border
          'icy-blue': '#87CEEB', // Sky blue
          'steel-blue': '#4682B4', // Steel blue
          'slate-steel': '#6A97BB', // Slate steel
          silver: '#C0C0C0',    // Metallic silver
          steel: '#64748B',     // Steel grey text
        }
      },
      backgroundImage: {
        'takra-gradient': 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #F1F5F9 100%)',
        'takra-accent': 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
};
