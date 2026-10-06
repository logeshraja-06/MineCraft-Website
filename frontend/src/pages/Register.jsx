import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useParticipant } from '../context/ParticipantContext';
import { participantApi } from '../services/participantApi';
import {
  User,
  Mail,
  Phone,
  Building2,
  BookOpen,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  LogIn,
  KeyRound,
  ShieldCheck,
  Cpu,
  Trophy,
} from 'lucide-react';

export default function Register() {
  const { registerParticipant, loginParticipant, participant } = useParticipant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

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
        participantId: form.phone.trim()
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
    <div className="min-h-screen bg-[#07080D] text-slate-100 font-sans selection:bg-purple-600 selection:text-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">

      {/* ── TOP SCROLL PROGRESS BAR ── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-400 origin-left z-[100] shadow-[0_0_12px_rgba(168,85,247,0.8)]"
      />

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── LEFT COLUMN: CREATIVE HERO VISUAL SHOWCASE ── */}
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 border border-purple-900/30 bg-[#0B0D15] flex flex-col justify-between overflow-hidden relative shadow-md"
        >

          {/* Top Hero Image Banner */}
          <div className="relative aspect-[16/10] overflow-hidden bg-black border-b border-purple-900/30">
            <motion.img
              initial={{ scale: 1.08 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="/hero-adventure.jpg"
              alt="Mind Craft Nether Arena"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D15] via-transparent to-black/40" />
            
            {/* Overlay Title */}
            <div className="absolute bottom-6 left-6 right-6 space-y-1 text-left">
              <span className="text-xs font-mono text-purple-400 font-medium uppercase tracking-wider block">
                Official Arena Enrollment
              </span>
              <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                Enter Mind Craft 2026
              </h2>
            </div>
          </div>

          {/* Middle: Mission Highlights */}
          <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between text-left">
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              Enrolling grants you verified entry into the 3-Tier Linear Mission Track. Solve checkpoints, earn golden keys, extract code from vault chests, and compile your solution under timed tournament conditions.
            </p>

            {/* 3 Editorial Feature Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { icon: <KeyRound className="w-5 h-5 text-amber-400" />, title: 'Checkpoint Tasks', desc: 'Solve MCQs & predict code output to unlock keys.' },
                { icon: <Cpu className="w-5 h-5 text-purple-400" />, title: 'Judge0 Sandbox', desc: 'Execute C, C++, Java or Python with 3 free test runs.' },
                { icon: <Trophy className="w-5 h-5 text-emerald-400" />, title: 'Speed Scoring', desc: '15-min countdown per level. Min negative points win.' },
              ].map((pillar, idx) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -4, borderColor: '#9333ea' }}
                  className="border border-purple-950/80 bg-[#07080D] p-4 space-y-2 transition-colors"
                >
                  {pillar.icon}
                  <h4 className="text-sm font-medium text-white">{pillar.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Bottom Citation */}
            <div className="pt-4 border-t border-purple-950/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 text-purple-300">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Official Contestant Access
              </span>
              <Link to="/rules" className="text-slate-400 hover:text-white transition-colors underline">
                View Tournament Rules
              </Link>
            </div>
          </div>

        </motion.div>

        {/* ── RIGHT COLUMN: CLEAN EDITORIAL REGISTRATION FORM (PURE WHITE BG) ── */}
        <motion.div
          initial={{ opacity: 0, x: 45 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 border border-slate-200 bg-white text-slate-900 p-8 sm:p-10 flex flex-col justify-between rounded-none shadow-sm"
        >

          <div>
            {/* Header */}
            <div className="space-y-2 mb-8 text-left">
              <h1 className="text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
                Participant Registration
              </h1>
              <p className="text-sm text-slate-500 font-normal leading-relaxed">
                Provide your contestant details to initiate your profile and begin the Easy challenge.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-3 text-left"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-normal text-sm leading-snug">{serverError}</span>
                </div>
                {canDirectLogin && (
                  <div className="pt-2 border-t border-rose-200 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDirectLogin}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs rounded-none transition-colors flex items-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Continue with this Account</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleResetAndRegister}
                      className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-100 font-medium text-xs rounded-none transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset &amp; Register Fresh</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-xs text-left">

              {/* Full Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>Full Name <span className="text-purple-600">*</span></span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  className={`w-full px-4 py-3 bg-slate-50 border ${
                    errors.fullName ? 'border-rose-400' : 'border-slate-300 focus:border-purple-600 focus:bg-white'
                  } rounded-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-colors font-sans`}
                />
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    <span>Email Address <span className="text-purple-600">*</span></span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="alex@college.edu"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.email ? 'border-rose-400' : 'border-slate-300 focus:border-purple-600 focus:bg-white'
                    } rounded-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-colors font-sans`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>Phone / WhatsApp <span className="text-purple-600">*</span></span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.phone ? 'border-rose-400' : 'border-slate-300 focus:border-purple-600 focus:bg-white'
                    } rounded-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-colors font-sans`}
                  />
                </div>
              </div>

              {/* College & Department Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>College Name <span className="text-purple-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. Engineering Institute"
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.college ? 'border-rose-400' : 'border-slate-300 focus:border-purple-600 focus:bg-white'
                    } rounded-none text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none transition-colors font-sans`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Department <span className="text-purple-600">*</span></span>
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 border ${
                      errors.department ? 'border-rose-400' : 'border-slate-300 focus:border-purple-600 focus:bg-white'
                    } rounded-none text-slate-900 text-sm focus:outline-none transition-colors font-sans`}
                  >
                    <option value="" disabled className="text-slate-400">Select department</option>
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
              </div>

              {/* Year of Study Selector */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-700 uppercase tracking-wider">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                  <span>Year of Study <span className="text-purple-600">*</span></span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {years.map((year) => {
                    const isSelected = form.yearOfStudy === year;
                    return (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        key={year}
                        onClick={() => setForm({ ...form, yearOfStudy: year })}
                        className={`p-3 text-center border font-mono text-xs transition-colors rounded-none ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-medium'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {year}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-8 bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm tracking-wide rounded-none transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? 'Registering Contestant...' : 'Enter The Arena'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>

            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200 text-xs text-slate-500 text-center font-mono">
            Already enrolled? Contact tournament coordinators or use direct login above.
          </div>

        </motion.div>

      </div>

    </div>
  );
}
