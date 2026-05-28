import React, { useState, useEffect } from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ToastContainer from './components/ToastContainer';
import { Sparkles } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = usePortfolio();
  const [currentPage, setCurrentPage] = useState('landing');

  // Sync route if already logged in on initial load
  useEffect(() => {
    if (!loading && user) {
      setCurrentPage('dashboard');
    } else if (!loading && !user) {
      setCurrentPage('landing');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans select-none transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-605 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-indigo-500/20">
            α
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-205 flex items-center gap-1.5 justify-center">
              CodeAlpha Stock Tracker <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </h3>
            <p className="text-[10px] text-slate-400">Loading portfolio holdings database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      {currentPage === 'landing' ? (
        <LandingPage onNavigateToDashboard={() => setCurrentPage('dashboard')} />
      ) : (
        <DashboardPage onNavigateToLanding={() => setCurrentPage('landing')} />
      )}
    </>
  );
};

function App() {
  return (
    <PortfolioProvider>
      <AppContent />
    </PortfolioProvider>
  );
}

export default App;
