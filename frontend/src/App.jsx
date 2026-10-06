import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AppRoutes from './routes/AppRoutes';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-[#07080D] text-slate-100 selection:bg-purple-600 selection:text-white font-sans relative overflow-x-hidden">
      <ScrollToTop />
      <Navbar />
      <main className={`flex-1 ${isHome ? '' : 'pt-20'}`}>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}
