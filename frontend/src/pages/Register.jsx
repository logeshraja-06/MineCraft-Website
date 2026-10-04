import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
<<<<<<< HEAD
import { User, Mail, Phone, Building2, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import api from '../services/api';
=======
import Button from '../components/common/Button';
import { UserCheck, AlertCircle } from 'lucide-react';
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5

export default function Register() {
  const { registerParticipant, participant } = useParticipant();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: participant?.name || '',
    email: participant?.email || '',
    phone: '',
    college: participant?.college || '',
    department: participant?.department || '',
    yearOfStudy: '1st Year'
  });

  const [errors, setErrors] = useState({});
<<<<<<< HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full Name is required';
=======
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.participantId.trim()) errs.participantId = 'Participant ID is required';
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
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
    if (!validate()) return;
<<<<<<< HEAD
    
    setIsSubmitting(true);
    // registerParticipant context expects name and other fields
    registerParticipant({
      name: form.fullName,
      email: form.email,
      college: form.college,
      department: form.department,
      phone: form.phone,
      yearOfStudy: form.yearOfStudy,
      participantId: form.phone // Use phone as a fallback ID if needed
    });

    try {
      const res = await api.post('/participant/register', {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        college: form.college,
        department: form.department,
        yearOfStudy: form.yearOfStudy,
        teamName: form.phone // Fallback for old API requirement
      });
      if (res.data?.token) {
        localStorage.setItem('mindcraft_token', res.data.token);
      }
    } catch (_) {
      // Continue even if backend call fails to allow testing flow
    } finally {
      setIsSubmitting(false);
=======

    try {
      setSubmitting(true);
      await registerParticipant({
        name: form.name.trim(),
        participantId: form.participantId.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        college: form.college.trim(),
        department: form.department.trim(),
      });
      navigate('/rules');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your credentials.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5
    }
  };

  const years = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[550px] w-full bg-white rounded-[2rem] shadow-xl shadow-orange-100/50 border border-orange-100/50 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="mb-5 relative z-10">
          <h2 className="text-3xl font-extrabold text-[#0B1A28] tracking-tight mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Participant Registration
          </h2>
          <p className="text-slate-500 text-[14px]">
            Fill in your details to register for Mind Craft.
=======
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-mono">
      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F28C0F]">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-wide">
            Participant Registration
          </h2>
          <p className="text-xs text-slate-600">
            Enter your competition credentials to unlock the challenge portal
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5
          </p>
          <div className="w-16 h-1 bg-[#FFBE4D] mt-2 rounded-full"></div>
        </div>

<<<<<<< HEAD
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <User className="w-4 h-4" strokeWidth={2.5} /> 
              <span>Full Name <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Enter your full name (as it should appear on certificate)"
              className={`w-full px-4 py-2.5 bg-[#FAFAFA] border ${errors.fullName ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#FFBE4D] focus:ring-[#FFBE4D]/20'} rounded-xl text-slate-800 placeholder:text-gray-400 text-[14px] focus:outline-none focus:ring-4 transition-all`}
            />
          </div>

          {/* Email ID */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <Mail className="w-4 h-4" strokeWidth={2.5} /> 
              <span>Email ID <span className="text-red-500">*</span></span>
            </label>
=======
        {serverError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block uppercase font-bold text-slate-700 mb-1">Participant Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F28C0F]"
            />
            {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block uppercase font-bold text-slate-700 mb-1">Participant ID *</label>
            <input
              type="text"
              value={form.participantId}
              onChange={(e) => setForm({ ...form, participantId: e.target.value.toUpperCase() })}
              placeholder="e.g. MC-101"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F28C0F] uppercase font-bold tracking-wider"
            />
            {errors.participantId && <p className="text-rose-500 text-[10px] mt-1">{errors.participantId}</p>}
          </div>

          <div>
            <label className="block uppercase font-bold text-slate-700 mb-1">Email Address *</label>
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
<<<<<<< HEAD
              placeholder="Enter your email address"
              className={`w-full px-4 py-2.5 bg-[#FAFAFA] border ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#FFBE4D] focus:ring-[#FFBE4D]/20'} rounded-xl text-slate-800 placeholder:text-gray-400 text-[14px] focus:outline-none focus:ring-4 transition-all`}
            />
          </div>

          {/* Phone / WhatsApp Number */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <Phone className="w-4 h-4" strokeWidth={2.5} /> 
              <span>Phone / WhatsApp Number <span className="text-red-500">*</span></span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Enter your phone / WhatsApp number"
              className={`w-full px-4 py-2.5 bg-[#FAFAFA] border ${errors.phone ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#FFBE4D] focus:ring-[#FFBE4D]/20'} rounded-xl text-slate-800 placeholder:text-gray-400 text-[14px] focus:outline-none focus:ring-4 transition-all`}
            />
          </div>

          {/* College Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <Building2 className="w-4 h-4" strokeWidth={2.5} /> 
              <span>College Name <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              value={form.college}
              onChange={(e) => setForm({ ...form, college: e.target.value })}
              placeholder="Enter your college name"
              className={`w-full px-4 py-2.5 bg-[#FAFAFA] border ${errors.college ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#FFBE4D] focus:ring-[#FFBE4D]/20'} rounded-xl text-slate-800 placeholder:text-gray-400 text-[14px] focus:outline-none focus:ring-4 transition-all`}
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <BookOpen className="w-4 h-4" strokeWidth={2.5} /> 
              <span>Department <span className="text-red-500">*</span></span>
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={`w-full px-4 py-2.5 bg-[#FAFAFA] border ${errors.department ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-[#FFBE4D] focus:ring-[#FFBE4D]/20'} rounded-xl text-slate-800 text-[14px] appearance-none focus:outline-none focus:ring-4 transition-all cursor-pointer`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.2em'
              }}
            >
              <option value="" disabled className="text-gray-400">Select your department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Electronics & Communication">Electronics & Communication</option>
              <option value="Electrical & Electronics">Electrical & Electronics</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Year of Study */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-[14px] font-bold text-[#0B1A28]">
              <GraduationCap className="w-4 h-4" strokeWidth={2.5} /> 
              <span>Year of Study <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {years.map((year) => {
                const isSelected = form.yearOfStudy === year;
                return (
                  <label 
                    key={year} 
                    className={`
                      relative flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-[#FFBE4D] bg-[#FFF9F0]' 
                        : 'border-gray-100 bg-white hover:border-gray-200'
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
                    <div className={`w-4 h-4 rounded-full border-2 mb-1 flex items-center justify-center transition-colors ${isSelected ? 'border-[#FFBE4D]' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#FFBE4D]"></div>}
                    </div>
                    <span className={`text-[13px] font-semibold ${isSelected ? 'text-[#0B1A28]' : 'text-slate-600'}`}>
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
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#FFC145] to-[#FFAB1A] hover:from-[#FFB52A] hover:to-[#FF9E00] text-[#0B1A28] font-bold text-[16px] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,171,26,0.3)] hover:shadow-[0_12px_25px_rgba(255,171,26,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registering...' : 'Register Now'} 
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
=======
              placeholder="you@college.edu"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F28C0F]"
            />
            {errors.email && <p className="text-rose-500 text-[10px] mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase font-bold text-slate-700 mb-1">College *</label>
              <input
                type="text"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="e.g. University Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F28C0F]"
              />
              {errors.college && <p className="text-rose-500 text-[10px] mt-1">{errors.college}</p>}
            </div>

            <div>
              <label className="block uppercase font-bold text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. CSE / IT"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F28C0F]"
              />
              {errors.department && <p className="text-rose-500 text-[10px] mt-1">{errors.department}</p>}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full font-bold bg-[#F28C0F] hover:bg-orange-500 text-slate-950" disabled={submitting}>
              {submitting ? 'REGISTERING...' : 'CONTINUE TO RULES →'}
            </Button>
>>>>>>> 4ef53940a45ad1dae46ac557bfb879ce57d6bbf5
          </div>
          
        </form>
      </div>
    </div>
  );
}

