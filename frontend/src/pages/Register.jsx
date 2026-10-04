import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { User, Mail, Phone, Building2, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const { registerParticipant, participant } = useParticipant();
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
    if (!validate()) return;
    
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
    }
    navigate(redirectUrl || '/challenges');
  };

  const years = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[550px] w-full bg-white rounded-[2rem] shadow-xl shadow-orange-100/50 border border-orange-100/50 p-6 sm:p-8 relative overflow-hidden">
        
        {/* Header Section */}
        <div className="mb-5 relative z-10">
          <h2 className="text-3xl font-extrabold text-[#0B1A28] tracking-tight mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Participant Registration
          </h2>
          <p className="text-slate-500 text-[14px]">
            Fill in your details to register for Mind Craft.
          </p>
          <div className="w-16 h-1 bg-[#FFBE4D] mt-2 rounded-full"></div>
        </div>

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
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          </div>
          
        </form>
      </div>
    </div>
  );
}

