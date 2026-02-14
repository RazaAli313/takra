import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import toast from 'react-hot-toast';

const JoinTeam = () => {
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', roll_no: '', campus: 'new', phone: '', email: '', position_applied: '', portfolio: '', linkedin: '', why_join: '', expertise: '', best_thing: '', improve: '', experience_alignment: '', other_society: '' });
  const pictureRef = useRef(null);
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [googleToken, setGoogleToken] = useState(null);
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationVerified, setVerificationVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/positions`);
        const data = await res.json();
        if (!cancelled) {
          setPositions((data && data.positions) || []);
          if ((data && data.positions && data.positions.length) && !form.position_applied) {
            setForm(prev => ({ ...prev, position_applied: data.positions[0].name }));
          }
        }
      } catch (err) {
        console.error('Failed to load positions', err);
      } finally {
        if (!cancelled) setLoadingPositions(false);
      }
    };
    // check public registrations status first — if closed, toast and redirect home
    const checkStatus = async () => {
      try {
        const sres = await fetch(`${API_BASE_URL}/registrations/status`);
        const sjson = await sres.json(); 
        if (sjson && sjson.open === false) {
          setAllowed(false);
          toast.error('Registrations are currently closed');
          // allow toast to show briefly then redirect to home
          setTimeout(() => navigate('/'), 800);
          return;
        }
      } catch (e) {
        // if status check fails, allow showing the form (fail-open)
        console.warn('Failed to check registrations status', e);
      }
    };

    checkStatus();
    load();
    return () => { cancelled = true; };
  }, []);

  // load reCAPTCHA v2 checkbox if site key available
  useEffect(() => {
    // reCAPTCHA removed: no-op
  }, []);

  // Load Google Identity Services button if configured
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (document.getElementById('google-identity-script')) return;
    const s = document.createElement('script');
    s.id = 'google-identity-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      try {
        /* global google */
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (resp) => {
              // resp.credential is the ID token
              const idt = resp.credential;
              setGoogleToken(idt);
              // decode basic profile from id token to prefill name/email
              try {
                const payload = JSON.parse(atob(idt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                if (payload.email) setForm(prev => ({ ...prev, email: payload.email }));
                if (payload.name) setForm(prev => ({ ...prev, name: payload.name }));
              } catch (e) { /* ignore */ }
            }
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            { theme: 'outline', size: 'large', type: 'standard' }
          );
        }
      } catch (e) { console.warn('Google Identity init failed', e); }
    };
    document.body.appendChild(s);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // If the user changes the email after a code was sent/verified,
    // clear verification state so they must verify the current email.
    if (name === 'email') {
      setVerificationSent(false);
      setVerificationCode('');
      setVerificationVerified(false);
      // reset any resend cooldown (handled separately)
      setResendCooldown(0);
    }
  };

  const sendVerification = async () => {
    const email = form.email?.trim();
    if (!email) return toast.error('Enter your email first');
    setSendingVerification(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrations/request_verification`, { email });
      if (res.data && res.data.sent) {
        setVerificationSent(true);
        setVerificationVerified(false);
        // start a 60s cooldown before allowing resend (simple client-side guard)
        setResendCooldown(60);
        const tick = setInterval(() => setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(tick); return 0; }
          return prev - 1;
        }), 1000);
        toast.success('Verification code sent to your email');
      } else {
        toast('Verification request sent — check your email', { icon: '✉️' });
      }
    } catch (err) {
      console.error('Failed to send verification', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      toast.error(detail || 'Failed to send verification code');
    } finally {
      setSendingVerification(false);
    }
  };

  const verifyCode = async () => {
    const email = form.email?.trim();
    if (!email) return toast.error('Enter your email first');
    if (!verificationCode.trim()) return toast.error('Enter the code sent to your email');
    setVerifyingCode(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrations/verify_code`, { email, code: verificationCode.trim() });
      if (res.data && res.data.verified) {
        setVerificationVerified(true);
        toast.success('Email verified. You can now submit the application.');
      } else {
        // backend may respond with { verified: false, reason: '...' }
        const reason = res.data?.reason || 'Verification failed';
        toast.error(reason);
      }
    } catch (err) {
      console.error('Verification failed', err);
      const detail = err.response?.data?.detail || err.response?.data?.message || err.message;
      toast.error(detail || 'Verification failed');
    } finally {
      setVerifyingCode(false);
    }
  };

  const submitForm = async (data, pictureFile) => {
    setLoading(true);
    try {
      // reCAPTCHA removed: proceed without attaching recaptcha token
      const fd = new FormData();
      Object.keys(data).forEach(k => { if (data[k] !== undefined && data[k] !== null) fd.append(k, data[k]); });
  if (googleToken) fd.append('google_token', googleToken);
      if (pictureFile) fd.append('picture', pictureFile);
      const res = await axios.post(`${API_BASE_URL}/registrations/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Application submitted. Thank you!');
      // Optionally display server message if present
      if (res.data?.message) toast.success(res.data.message);
      // no reCAPTCHA to reset
      return res.data;
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Try again later.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!allowed) return;
     
    try {
      await submitForm(form, pictureRef.current?.files?.[0]);
      setForm({ name: '', roll_no: '', campus: 'new', phone: '', email: '', position_applied: positions[0]?.name || '', portfolio: '', linkedin: '', why_join: '', expertise: '', best_thing: '', improve: '', experience_alignment: '', other_society: '' });
      if (pictureRef.current) pictureRef.current.value = '';
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-gray-900 to-black text-white py-16">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-8">Join FCIT Developers Club</h1>
          <p className="text-gray-300 mt-2">Apply for a team position or an executive role. Provide a short note on why you fit the role and optionally upload a profile picture.</p>
        </div>

        {/* single unified application form (positions are loaded dynamically) */}

        <div className="bg-gray-800/60 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-xl">
          <form onSubmit={onSubmit} className="space-y-6">
            {GOOGLE_CLIENT_ID && (
              <div className="mb-4">
                <div id="google-signin-button" />
                {googleToken && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-300">Signed in with Google as <strong>{form.name || form.email}</strong></div>
                    <button type="button" onClick={() => { setGoogleToken(null); }} className="text-xs text-gray-400 underline">Sign out</button>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 focus:ring-blue-500" />
              <input name="roll_no" placeholder="University Roll No" value={form.roll_no} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
              <select name="campus" value={form.campus} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700">
                <option value="new">New Campus</option>
                <option value="old">Old Campus</option>
              </select>
              <select name="position_applied" value={form.position_applied} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700">
                <option value="">Select position you're applying for</option>
                {positions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <input name="phone" placeholder="Phone number" value={form.phone} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
              <div className="md:col-span-2 flex gap-2 items-center">
                <input name="email" type="email" placeholder="Email address" value={form.email} onChange={handleChange} required className="flex-1 p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
                <button type="button" onClick={sendVerification} disabled={resendCooldown > 0 || sendingVerification} className={`px-3 py-2 rounded ${(resendCooldown > 0 || sendingVerification) ? 'bg-gray-600' : 'bg-blue-600'}`}>
                  {sendingVerification ? 'Sending...' : (resendCooldown > 0 ? `Resend (${resendCooldown}s)` : (verificationSent ? 'Resend code' : 'Send code'))}
                </button>
              </div>
              {verificationSent && !verificationVerified && (
                <div className="md:col-span-2 flex gap-2 items-center">
                  <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="Enter verification code" className="flex-1 p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
                  <button type="button" onClick={verifyCode} disabled={verifyingCode} className={`px-3 py-2 rounded ${verifyingCode ? 'bg-gray-600' : 'bg-green-600'}`}>{verifyingCode ? 'Verifying...' : 'Verify'}</button>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">Profile picture (optional, JPG/PNG)</label>
                <input type="file" ref={pictureRef} accept="image/*" className="w-full text-sm text-gray-200" />
              </div>
              <input name="portfolio" placeholder="Portfolio website (optional)" value={form.portfolio} onChange={handleChange} className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" />
              <input name="linkedin" placeholder="LinkedIn" value={form.linkedin} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" />
              <textarea name="why_join" placeholder="Why do you want to join FDC?" value={form.why_join} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" rows={3} />
              <textarea name="expertise" placeholder="Which expertise would you bring to FDC?" value={form.expertise} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" rows={2} />
              <textarea name="experience_alignment" placeholder="How does your past experience align with the position you're applying for?" value={form.experience_alignment} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" rows={3} />
              <input name="other_society" placeholder="Have you been part of any other society? If yes, mention otherwise N/A" value={form.other_society} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700 md:col-span-2" />
              <input name="best_thing" placeholder="One best thing about you" value={form.best_thing} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
              <input name="improve" placeholder="One thing you want to improve about yourself" value={form.improve} onChange={handleChange} required className="p-3 bg-gray-900 rounded ring-1 ring-gray-700" />
            </div>

            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={loading || !verificationVerified} className={`px-6 py-2 rounded font-medium shadow ${verificationVerified ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-600 cursor-not-allowed'}`}>
                {loading ? 'Submitting...' : 'Apply'}
              </button>
            </div>
            {loadingPositions && <p className="text-sm text-gray-400 mt-2">Loading positions...</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinTeam;
