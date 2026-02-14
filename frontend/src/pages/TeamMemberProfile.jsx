import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ClockIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/atom-one-dark.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SocialLink = ({ href, children }) => {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline mr-3">
      {children}
    </a>
  );
};

const TeamMemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get tenure from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tenureFromUrl = urlParams.get('tenure');

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API_BASE_URL}/members/${id}`);
        setMember(res.data);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.detail || err.message || 'Failed to load member');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMember();
  }, [id]);
  
  // Get role for the specific tenure
  const getRoleForTenure = (member, tenure) => {
    if (!member) return 'Member';
    
    // If tenure is provided and member has roles_by_tenure, use that
    if (tenure && member.roles_by_tenure && typeof member.roles_by_tenure === 'object') {
      if (member.roles_by_tenure[tenure]) {
        return member.roles_by_tenure[tenure];
      }
    }
    
    // Fallback to role field or default
    return member.role || 'Member';
  };
  
  // Get display role - prioritize tenure-specific role if available
  const displayRole = tenureFromUrl 
    ? getRoleForTenure(member, tenureFromUrl)
    : (member?.role || 'Member');
  
  // Get all tenures and their roles for display
  const getAllTenuresWithRoles = (member) => {
    if (!member) return [];
    
    const tenures = Array.isArray(member.tenure) ? member.tenure : (member.tenure ? [member.tenure] : []);
    const rolesByTenure = member.roles_by_tenure || {};
    
    return tenures.map(t => ({
      tenure: t,
      role: rolesByTenure[t] || member.role || 'Member'
    })).sort((a, b) => {
      // Sort by tenure (newest first)
      if (a.tenure === 'Unknown') return 1;
      if (b.tenure === 'Unknown') return -1;
      return b.tenure.localeCompare(a.tenure);
    });
  };
  
  const allTenuresWithRoles = member ? getAllTenuresWithRoles(member) : [];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border--500"></div>
    </div>
  );

  if (error || !member) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900 text-white">
      <div className="text-center">
        <p className="text-xl mb-4">{error || 'Member not found'}</p>
        <motion.button 
          onClick={() => navigate('/team')} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors duration-200 group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Team</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-indigo-900 text-white py-20">
      <div className="container mx-auto px-6">
        <motion.button 
          onClick={() => navigate('/team')} 
          whileHover={{ scale: 1.05, x: -4 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 text-blue-400 hover:text-blue-300 transition-all duration-200 font-semibold group bg-gray-800/80 hover:bg-gray-800 rounded-lg border border-blue-500/30 hover:border-blue-500/60 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Team</span>
        </motion.button>
        <motion.div id="member-profile-to-print" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-indigo-500">
              {member.image_url ? (
                <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center">{member.name?.charAt(0)}</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{member.name}</h1>
              <div className="mb-4">
                <p className="text-blue-300 text-lg font-semibold">{displayRole}</p>
                {tenureFromUrl && allTenuresWithRoles.length > 1 && (
                  <p className="text-sm text-gray-400 mt-1">Role for {tenureFromUrl}</p>
                )}
                {!tenureFromUrl && allTenuresWithRoles.length > 1 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-2">All Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {allTenuresWithRoles.map(({ tenure, role }, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-700 rounded-lg text-sm">
                          <span className="text-blue-300 font-medium">{tenure}:</span> <span className="text-gray-300">{role}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => downloadProfileAsPDF(member)}
                  className="px-3 py-1 bg-gray-700 text-sm rounded hover:bg-gray-600"
                >Download Profile (PDF)</button>
                {member.socials?.portfolio && (
                  <a href={member.socials.portfolio} target="_blank" rel="noreferrer" className="ml-2 text-sm text-blue-300 underline">Portfolio</a>
                )}
              </div>
              <div id="member-bio-to-print" className="prose prose-invert max-w-none text-gray-300 mb-4">
                {member.bio ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize, rehypeHighlight]}>
                    {member.bio}
                  </ReactMarkdown>
                ) : (
                  <p>No bio provided.</p>
                )}
              </div>

              {/* Portfolio-style sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">Skills</h4>
                  {member.skills && member.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((s, i) => (
                        <span key={i} className="bg-gray-700 px-3 py-1 rounded text-sm">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No skills listed. </p>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Projects</h4>
                  {member.projects && member.projects.length > 0 ? (
                    <div className="space-y-3">
                      {member.projects.map((p, i) => (
                        <div key={i} className="bg-gray-900 p-3 rounded">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold">{p.title}</h5>
                            {p.url && (<a href={p.url} target="_blank" rel="noreferrer" className="text-blue-300 text-sm">View</a>)}
                          </div>
                          {p.description && <p className="text-gray-400 text-sm mt-1">{p.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No projects listed.</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Experience</h4>
                {member.experience && member.experience.length > 0 ? (
                  <div className="space-y-3">
                    {member.experience.map((e, i) => (
                      <div key={i} className="bg-gray-900 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{e.role} • {e.company}</div>
                            <div className="text-sm text-gray-400">{e.period}</div>
                          </div>
                        </div>
                        {e.description && <p className="text-gray-400 text-sm mt-1">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No experience entries.</p>
                )}
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Education</h4>
                {member.education && member.education.length > 0 ? (
                  <div className="space-y-3">
                    {member.education.map((ed, i) => (
                      <div key={i} className="bg-gray-900 p-3 rounded">
                        <div className="font-semibold">{ed.degree} — {ed.institution}</div>
                        <div className="text-sm text-gray-400">{ed.period}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No education listed.</p>
                )}
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Contact</h4>
                <div className="flex items-center gap-3">
                  {member.socials?.linkedin && <a href={member.socials.linkedin} target="_blank" rel="noreferrer" className="text-blue-300">LinkedIn</a>}
                  {member.socials?.github && <a href={member.socials.github} target="_blank" rel="noreferrer" className="text-blue-300">GitHub</a>}
                  {member.socials?.twitter && <a href={member.socials.twitter} target="_blank" rel="noreferrer" className="text-blue-300">Twitter</a>}
                </div>
              </div>

              <div className="flex items-center mt-6">
                <SocialLink href={member.socials?.linkedin}><svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>LinkedIn</SocialLink>
                <SocialLink href={member.socials?.github}><svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>GitHub</SocialLink>
                <SocialLink href={member.socials?.twitter}><svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>Twitter</SocialLink>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Client-side PDF generation: render the bio/profile container to canvas and add to PDF
async function downloadBioAsPDF(member) {
  try {
    const el = document.getElementById('member-bio-to-print');
    if (!el) {
      alert('Profile content not found');
      return;
    }

    // Get computed width/height so the clone has the same layout
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 600);

    // Clone the element to avoid layout shifts; place it off-screen but visible to html2canvas
    const clone = el.cloneNode(true);
    clone.style.boxSizing = 'border-box';
    clone.style.width = `${width}px`;
    clone.style.padding = window.getComputedStyle(el).padding || '20px';
    clone.style.background = '#0f172a'; // solid background to ensure visibility
    clone.style.color = '#e5e7eb';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '9999';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait briefly to allow images/fonts to load inside the clone
    await new Promise((res) => setTimeout(res, 250));

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 40; // margins
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // If content fits on one page, add and save. Otherwise paginate by slicing canvas.
    if (imgHeight <= pageHeight - 40) {
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
    } else {
      // Paginate: draw canvas in chunks
      const canvasHeight = canvas.height;
      const pxPerPt = canvas.height / imgHeight; // pixels per pdf point
      let remainingHeight = canvasHeight;
      let yOffset = 0;
      let page = 0;

      while (remainingHeight > 0) {
        const sliceHeightPx = Math.floor((pageHeight - 40) * pxPerPt);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeightPx, remainingHeight);
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const sliceImgProps = pdf.getImageProperties(sliceData);
        const sliceImgWidth = pageWidth - 40;
        const sliceImgHeight = (sliceImgProps.height * sliceImgWidth) / sliceImgProps.width;

        if (page > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', 20, 20, sliceImgWidth, sliceImgHeight);

        remainingHeight -= sliceHeightPx;
        yOffset += sliceHeightPx;
        page += 1;
      }
    }

    const filename = `${(member.name || 'member').replace(/\s+/g, '_')}_bio.pdf`;
    pdf.save(filename);

    // cleanup
    document.body.removeChild(wrapper);
  } catch (err) {
    console.error('Failed to generate PDF', err);
    alert('Failed to generate PDF. Please try in a desktop browser.');
  }
}

// Capture the entire profile card and generate a professional PDF (white background)
async function downloadProfileAsPDF(member) {
  try {
    const el = document.getElementById('member-profile-to-print');
    if (!el) {
      alert('Profile content not found');
      return;
    }

    // Load logo as data URL before PDF content is added
    let logoDataUrl = null;
    async function getLogoDataUrl() {
      try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    }
    logoDataUrl = await getLogoDataUrl();

    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 700);

    const clone = el.cloneNode(true);
    clone.style.boxSizing = 'border-box';
    clone.style.width = `${width}px`;
    clone.style.padding = '40px';
    clone.style.background = '#ffffff';
    clone.style.color = '#111827';
    clone.style.fontFamily = window.getComputedStyle(el).fontFamily || 'Arial, Helvetica, sans-serif';

    // Insert a print override stylesheet into the clone to remove green/ colors and hide interactive controls
    const style = document.createElement('style');
    style.textContent = `
      * { color: #111827 !important; background-color: transparent !important; }
      a { color: #0b5cff !important; text-decoration: none !important; }
      [class*=""], [class*="green"], [class*="emerald"], [class*="lime"], [class*="cyan"] {
        color: #111827 !important;
        background-color: transparent !important;
      }
      [class*="bg-"], [class*="bg-green"], [class*="bg-emerald"], [class*="bg-lime"], [class*="bg-cyan"] {
        background-color: transparent !important;
      }
      button, .no-print, .download-button { display: none !important; }
      .prose a { color: #0b5cff !important; }
      .bg-gray-900 { background-color: transparent !important; }
      .bg-gray-800 { background-color: transparent !important; }
    `;
    clone.prepend(style);

    // Hide/remove any download buttons or interactive controls inside the clone
    clone.querySelectorAll('button').forEach((b) => {
      const txt = (b.innerText || '').toLowerCase();
      if (txt.includes('download') || txt.includes('save') || b.classList.contains('download-button')) {
        b.remove();
      } else {
        b.style.display = 'none';
      }
    });

    // Ensure images are print-friendly
    const imgs = clone.querySelectorAll('img');
    imgs.forEach((img) => {
      img.style.maxWidth = '150px';
      img.style.maxHeight = '150px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '50%';
    });

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '9999';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait for images inside clone to load
    const cloneImgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(cloneImgs.map((img) => {
      return new Promise((res) => {
        if (!img.src) return res();
        if (img.complete) return res();
        img.onload = img.onerror = () => res();
      });
    }));

    // short delay for fonts/styles
    await new Promise((res) => setTimeout(res, 300));

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 60;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    const headerHeight = 60; // space for logo and club name
    if (imgHeight <= pageHeight - 80 - headerHeight) {
      // Draw header/logo first
      pdf.setFontSize(16);
      pdf.setTextColor(30);
      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', 30, 20, 40, 40);
        pdf.text('Taakra 2026', 80, 40, { align: 'left' });
      } else {
        pdf.text('Taakra 2026', 30, 40, { align: 'left' });
      }
      // Draw profile content below header
      pdf.addImage(imgData, 'PNG', 30, 30 + headerHeight, imgWidth, imgHeight);
    } else {
      // Paginate: draw header/logo and then canvas chunks below header
      const canvasHeight = canvas.height;
      const pxPerPt = canvas.height / imgHeight;
      let remaining = canvasHeight;
      let y = 0;
      let page = 0;
      while (remaining > 0) {
        const sliceH = Math.floor((pageHeight - 80 - headerHeight) * pxPerPt);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceH, remaining);
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, y, canvas.width, sliceCanvas.height, 0, 0, sliceCanvas.width, sliceCanvas.height);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const sliceImgProps = pdf.getImageProperties(sliceData);
        const sliceW = pageWidth - 60;
        const sliceHpt = (sliceImgProps.height * sliceW) / sliceImgProps.width;

        if (page > 0) pdf.addPage();
        // Draw header/logo at top of each page
        pdf.setFontSize(16);
        pdf.setTextColor(30);
        if (logoDataUrl) {
          pdf.addImage(logoDataUrl, 'PNG', 30, 20, 40, 40);
          pdf.text('Taakra 2026', 80, 40, { align: 'left' });
        } else {
          pdf.text('Taakra 2026', 30, 40, { align: 'left' });
        }
        // Draw profile chunk below header
        pdf.addImage(sliceData, 'PNG', 30, 30 + headerHeight, sliceW, sliceHpt);

        remaining -= sliceH;
        y += sliceH;
        page += 1;
      }
    }

    // Make only the already rendered social links in the profile clickable in the PDF
    try {
      const anchors = Array.from(clone.querySelectorAll('a[href]'));
      if (anchors.length > 0) {
        // Get scale between DOM and PDF
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const cloneWidth = clone.clientWidth || rect.width;
        const cloneHeight = clone.clientHeight || rect.height;
        const scaleX = imgWidth / cloneWidth;
        const scaleY = imgHeight / cloneHeight;
        // Offset for PDF placement (profile image and header)
        const pdfOffsetX = 30;
        const pdfOffsetY = 30 + headerHeight;
        anchors.forEach((a) => {
          try {
            const href = a.href || a.getAttribute('href');
            if (!href) return;
            const aRect = a.getBoundingClientRect();
            const cRect = clone.getBoundingClientRect();
            // Relative position in clone
            const relLeft = aRect.left - cRect.left;
            const relTop = aRect.top - cRect.top;
            const relW = aRect.width;
            const relH = aRect.height;
            // Map to PDF coordinates
            const pdfX = pdfOffsetX + relLeft * scaleX;
            const pdfY = pdfOffsetY + relTop * scaleY;
            const pdfW = Math.max(1, relW * scaleX);
            const pdfH = Math.max(1, relH * scaleY);
            // Only add link if it is visible and has size
            if (pdfW > 1 && pdfH > 1) {
              pdf.link(pdfX, pdfY, pdfW, pdfH, { url: href });
            }
          } catch (e) {
            // skip this anchor
          }
        });
      }
    } catch (e) {
      // non-fatal: skip social link mapping
    }

    // Add header with logo and club name, and footer with page numbers
    const totalPages = pdf.internal.getNumberOfPages();
    // Prepare footer info
    const email = member.email || 'contact@taakra2026.com';
    const website = (member.socials && member.socials.website) ? member.socials.website : 'https://fdc-pucit.org';
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(16);
      pdf.setTextColor(30);
      if (logoDataUrl) {
        pdf.addImage(logoDataUrl, 'PNG', 30, 20, 40, 40);
        pdf.text('Taakra 2026', 80, 40, { align: 'left' });
      } else {
        pdf.text('Taakra 2026', 30, 40, { align: 'left' });
      }
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(email, 40, pageHeight - 30);
      pdf.text(website, 40, pageHeight - 18);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 30, { align: 'right' });
    }

    const filename = `${(member.name || 'member').replace(/\s+/g, '_')}_profile.pdf`;
    pdf.save(filename);

    document.body.removeChild(wrapper);
  } catch (err) {
    console.error('Failed to generate profile PDF', err);
    alert('Failed to generate PDF. Try in a desktop browser.');
  }
}

export default TeamMemberProfile;
