import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { participantApi } from '../services/participantApi';
import { User, Mail, Phone, Building2, BookOpen, GraduationCap, ArrowRight, AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const { registerParticipant, loginParticipant, participant } = useParticipant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [form, setForm] = useState({
    fullName: participant?.name || '',
    email: participant?.email || '',
    phone: '',
    college: participant?.college || '',
    department: participant?.department || '',
    yearOfStudy: '1st Year'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [canDirectLogin, setCanDirectLogin] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email format';
    }
    if (!form.phone.trim()) errs.phone = 'Phone / WhatsApp Number is required';
    if (!form.college.trim()) errs.college = 'College Name is required';
    if (!form.department.trim()) errs.department = 'Department is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setCanDirectLogin(false);
    if (!validate()) return;
    
    try {
      setIsSubmitting(true);
      
      await registerParticipant({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        college: form.college.trim(),
        department: form.department.trim(),
        phone: form.phone.trim(),
        yearOfStudy: form.yearOfStudy,
        participantId: form.phone.trim() // using phone as fallback
      });
      
      navigate(redirectUrl || '/rules');
      
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your credentials.';
      setServerError(msg);
      if (err.response?.status === 409 || msg.toLowerCase().includes('already registered')) {
        setCanDirectLogin(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectLogin = async () => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await loginParticipant({
        email: form.email.trim().toLowerCase(),
        participantId: form.phone.trim(),
        phone: form.phone.trim(),
      });
      navigate(redirectUrl || '/rules');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please verify your phone and email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndRegister = async () => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await participantApi.logoutAndDelete({
        email: form.email.trim().toLowerCase(),
        participantId: form.phone.trim(),
      });
      // Now re-register fresh
      await registerParticipant({
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        college: form.college.trim(),
        department: form.department.trim(),
        phone: form.phone.trim(),
        yearOfStudy: form.yearOfStudy,
        participantId: form.phone.trim(),
      });
      navigate(redirectUrl || '/rules');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to reset profile. Please try logging in instead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const years = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

  return (
    <div className="min-h-screen bg-[#07080D] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[550px] w-full bg-[#0D0F18]/90 rounded-[2rem] shadow-[0_0_50px_rgba(168,85,247,0.18)] border border-purple-500/30 p-6 sm:p-8 relative overflow-hidden backdrop-blur-xl z-10 font-mono">
        
        {/* Header Section */}
        <div className="mb-6 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]" />
            BUILT FOR CREATORS // CONTESTANT ACCESS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PARTICIPANT <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">REGISTRATION</span>
          </h2>
          <p className="text-purple-200/60 text-xs font-sans">
            Fill in your contestant details to access the Mind Craft Nether Arena.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 p-4 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs space-y-2.5 relative z-10 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="font-semibold text-[13px] leading-snug">{serverError}</span>
            </div>
            {canDirectLogin && (
              <div className="pt-2 border-t border-rose-500/30 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDirectLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition shadow-sm border border-purple-400/40"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Continue with this Account
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResetAndRegister}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141724] border border-rose-400/40 text-rose-300 hover:bg-rose-950/60 font-semibold rounded-lg text-xs transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset & Register Fresh
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-xs font-sans">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider font-mono">
              <User className="w-3.5 h-3.5 text-purple-400" /> 
              <span>Full Name <span className="text-purple-400">*</span></span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Enter your full name"
              className={`w-full px-4 py-2.5 bg-[#141724]/90 border ${errors.fullName ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/20'} rounded-xl text-white placeholder:text-purple-300/40 text-xs focus:outline-none focus:ring-2 transition-all font-mono`}
            />
          </div>

          {/* Email ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider font-mono">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> 
              <span>Email ID <span className="text-purple-400">*</span></span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email address"
              className={`w-full px-4 py-2.5 bg-[#141724]/90 border ${errors.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/20'} rounded-xl text-white placeholder:text-purple-300/40 text-xs focus:outline-none focus:ring-2 transition-all font-mono`}
            />
          </div>

          {/* Phone / WhatsApp Number */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider font-mono">
              <Phone className="w-3.5 h-3.5 text-purple-400" /> 
              <span>Phone / WhatsApp Number <span className="text-purple-400">*</span></span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter your phone / WhatsApp number"
              className={`w-full px-4 py-2.5 bg-[#141724]/90 border ${errors.phone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/20'} rounded-xl text-white placeholder:text-purple-300/40 text-xs focus:outline-none focus:ring-2 transition-all font-mono`}
            />
          </div>

          {/* College Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider font-mono">
              <Building2 className="w-3.5 h-3.5 text-purple-400" /> 
              <span>College Name <span className="text-purple-400">*</span></span>
            </label>
            <input
              type="text"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              placeholder="Enter your college name"
              className={`w-full px-4 py-2.5 bg-[#141724]/90 border ${errors.college ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/20'} rounded-xl text-white placeholder:text-purple-300/40 text-xs focus:outline-none focus:ring-2 transition-all font-mono`}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider font-mono">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" /> 
              <span>Department <span className="text-purple-400">*</span></span>
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={`w-full px-4 py-2.5 bg-[#141724]/90 border ${errors.department ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-500/20'} rounded-xl text-white text-xs appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer font-mono`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C084FC'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.2em'
              }}
            >
              <option value="" disabled className="bg-[#0D0F18] text-slate-400">Select your department</option>
              <option value="Computer Science" className="bg-[#0D0F18]">Computer Science</option>
              <option value="Information Technology" className="bg-[#0D0F18]">Information Technology</option>
              <option value="Artificial Intelligence" className="bg-[#0D0F18]">Artificial Intelligence</option>
              <option value="Electronics & Communication" className="bg-[#0D0F18]">Electronics & Communication</option>
              <option value="Electrical & Electronics" className="bg-[#0D0F18]">Electrical & Electronics</option>
              <option value="Mechanical Engineering" className="bg-[#0D0F18]">Mechanical Engineering</option>
              <option value="Civil Engineering" className="bg-[#0D0F18]">Civil Engineering</option>
              <option value="Other" className="bg-[#0D0F18]">Other</option>
            </select>
          </div>

          {/* Year of Study */}
          <div className="space-y-2 pt-1 font-mono">
            <label className="flex items-center gap-2 text-xs font-bold text-purple-200 uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> 
              <span>Year of Study <span className="text-purple-400">*</span></span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {years.map((year) => {
                const isSelected = form.yearOfStudy === year;
                return (
                  <label 
                    key={year} 
                    className={`
                      relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-purple-400 bg-purple-950/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                        : 'border-purple-500/20 bg-[#141724]/60 hover:border-purple-500/40'
                      }
                    `}
                  >
                    <input 
                      type="radio" 
                      name="yearOfStudy" 
                      value={year}
                      checked={isSelected}
                      onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border mb-1 flex items-center justify-center transition-colors ${isSelected ? 'border-purple-300' : 'border-slate-600'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]"></div>}
                    </div>
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-purple-200/60'}`}>
                      {year}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(168,85,247,0.45)] border border-purple-400/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'ENTER THE ARENA'} 
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
