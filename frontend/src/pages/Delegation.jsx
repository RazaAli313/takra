import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Delegation = () => {
  const [name, setName] = useState('');
  const [cnic, setCnic] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [batch, setBatch] = useState('');
  const [campus, setCampus] = useState('old');
  const [resume, setResume] = useState(null);
  const [whyJoin, setWhyJoin] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!cnic.trim()) return 'CNIC is required';
    const cnicDigits = cnic.replace(/\D/g, '');
    if (cnicDigits.length !== 13) return 'CNIC must contain 13 digits';
    if (!email.trim()) return 'Email is required';
    if (!phone.trim()) return 'Phone is required';
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) return 'Phone number seems invalid';
    if (!batch.trim()) return 'Batch is required';
    if (!whyJoin.trim()) return 'Please tell us why you want to join';
    // resume optional but recommended
    if (resume) {
      const allowed = ['application/pdf'];
      if (!allowed.includes(resume.type)) return 'Resume must be a PDF file';
      if (resume.size > 10 * 1024 * 1024) return 'Resume must be under 10MB';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('cnic', cnic);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('batch', batch);
      fd.append('campus', campus);
      fd.append('why_join', whyJoin);
      if (comments) fd.append('comments', comments);
      if (resume) fd.append('resume', resume);

      const res = await axios.post(`${API_BASE_URL}/delegation`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      if (res.data && res.data.ok) {
        toast.success('Delegation request submitted successfully');
        // reset
        setName(''); setCnic(''); setEmail(''); setPhone(''); setBatch(''); setCampus('old'); setResume(null); setWhyJoin(''); setComments('');
      } else {
        toast.success('Submission complete');
      }
    } catch (err) {
      console.error('Delegation submit failed', err);
      const msg = err?.response?.data?.detail || err?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect to home if delegation form is closed
  const navigate = useNavigate();
  useEffect(() => {
    const checkOpen = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/delegation/status`);
        if (!res.data.open) {
          toast.error("Delegation form is currently closed. Redirecting...");
          navigate('/');
        }
      } catch (err) {
        // if status check fails, allow access but log
        console.warn('Failed to check delegation status', err);
      }
    };
    checkOpen();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white py-16">
      <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">FDC - Delegation Form</h2>
        <p className="text-sm text-gray-400 mb-6">Please fill the form. Resume upload is optional but recommended.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Name*</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
          </div>
          <div>
            <label className="block text-sm text-gray-300">CNIC* (13 digits)</label>
            <input value={cnic} onChange={e=>setCnic(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300">Email*</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full p-2 rounded bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Phone*</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300">Batch*</label>
              <input value={batch} onChange={e=>setBatch(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm text-gray-300">Campus*</label>
              <select value={campus} onChange={e=>setCampus(e.target.value)} className="w-full p-2 rounded bg-gray-700">
                <option value="old">Old</option>
                <option value="new">New</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300">Resume (PDF only)</label>
            <input type="file" accept=".pdf" onChange={e=>setResume(e.target.files[0])} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">If you prefer, you can upload later. We will store resume securely on Cloudinary.</p>
          </div>

          <div>
            <label className="block text-sm text-gray-300">Why do you want to join this initiative?*</label>
            <textarea value={whyJoin} onChange={e=>setWhyJoin(e.target.value)} rows={5} className="w-full p-2 rounded bg-gray-700" />
          </div>

          <div>
            <label className="block text-sm text-gray-300">Any comments (optional)</label>
            <textarea value={comments} onChange={e=>setComments(e.target.value)} rows={3} className="w-full p-2 rounded bg-gray-700" />
          </div>

          <div className="flex justify-end">
            <button disabled={submitting} type="submit" className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 rounded">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Delegation;
