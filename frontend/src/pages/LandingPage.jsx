import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import AuthModal from '../components/AuthModal';
import { Sun, Moon, TrendingUp, Shield, BarChart3, Bell, ArrowRight, Menu, X, Play } from 'lucide-react';

const LandingPage = ({ onNavigateToDashboard }) => {
  const { user, theme, toggleTheme } = usePortfolio();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultRegister, setAuthDefaultRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulated live ticker for landing page hero visual showcase
  const [heroPrices, setHeroPrices] = useState({
    AAPL: { price: 172.50, change: 1.25 },
    TSLA: { price: 184.20, change: -2.40 },
    NVDA: { price: 875.12, change: 4.80 }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroPrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(ticker => {
          const changePct = (Math.random() * 2 - 1) * 0.005; // -0.5% to +0.5%
          const oldPrice = next[ticker].price;
          const newPrice = Math.max(1, Number((oldPrice * (1 + changePct)).toFixed(2)));
          const delta = Number((newPrice - oldPrice).toFixed(2));
          next[ticker] = {
            price: newPrice,
            change: Number((next[ticker].change + delta).toFixed(2))
          };
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const openAuth = (register = false) => {
    setAuthDefaultRegister(register);
    setIsAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const handleStartTracking = () => {
    if (user) {
      onNavigateToDashboard();
    } else {
      openAuth(true);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. STICKY NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                α
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                CodeAlpha<span className="text-indigo-600 font-semibold">Stock</span>
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-650 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium text-slate-650 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 transition-colors">
                About
              </a>
              {user && (
                <button
                  onClick={onNavigateToDashboard}
                  className="text-sm font-semibold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-350 transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
            </div>

            {/* Right Buttons: Theme, Login/Register */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Hi, <strong className="text-slate-800 dark:text-white font-semibold">{user.username}</strong>
                  </span>
                  <button onClick={onNavigateToDashboard} className="btn-primary text-sm flex items-center gap-1.5 py-2">
                    Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => openAuth(false)}
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => openAuth(true)}
                    className="btn-primary text-sm py-2"
                  >
                    Start Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Trigger */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-lg">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About
            </a>
            
            {user ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <p className="px-3 text-sm text-slate-600 dark:text-slate-400">
                  Logged in as <strong className="text-slate-900 dark:text-white">{user.username}</strong>
                </p>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigateToDashboard(); }}
                  className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-1.5"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => openAuth(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth(true)}
                  className="w-full btn-primary text-sm py-2.5 flex items-center justify-center"
                >
                  Start Tracking
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <header className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        
        {/* Left Callout */}
        <div className="flex-1 text-center lg:text-left space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Real-time Simulation
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-sans tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Track Your Stocks, <br />
            <span className="gradient-text">Empower Investments</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
            A premium dashboard to monitor stock assets, compute real-time profit and loss ratios, map growth curves, and export professional reports.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={handleStartTracking}
              className="w-full sm:w-auto btn-primary text-base font-semibold px-8 py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Start Tracking Now <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto btn-secondary text-base font-semibold px-8 py-3.5 flex items-center justify-center gap-2"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Right Dashboard Mockup Visual (CSS-only) */}
        <div className="flex-1 w-full max-w-xl animate-slide-up">
          <div className="glass-panel p-5 border border-white/40 dark:border-slate-800/40 shadow-2xl relative bg-white/40 dark:bg-slate-900/40">
            
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                portfolio_dashboard.app
              </div>
            </div>

            {/* Mock Summary Widgets */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Portfolio Value</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">$45,212.50</p>
                <span className="text-[10px] text-emerald-600 font-semibold">+12.4% this week</span>
              </div>
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Profit / Loss</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">+$5,124.00</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">From 8 holdings</span>
              </div>
            </div>

            {/* Live Ticker Display */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Interactive Showcase Ticker</p>
              {Object.entries(heroPrices).map(([ticker, info]) => {
                const isPositive = info.change >= 0;
                return (
                  <div 
                    key={ticker}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center font-bold text-indigo-600 text-xs">
                        {ticker.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{ticker}</p>
                        <p className="text-[10px] text-slate-400">
                          {ticker === 'AAPL' && 'Apple Inc.'}
                          {ticker === 'TSLA' && 'Tesla Motors'}
                          {ticker === 'NVDA' && 'NVIDIA Corp'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">${info.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{info.change}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Glow Panel */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

      </header>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="bg-white/50 dark:bg-slate-950/20 py-20 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">
              Features Designed For Smart Investors
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Track stock values, visualize distributions, and audit portfolio health with modern analytical tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="glass-panel glass-panel-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Portfolio Control</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Log purchase dates, specify quantities and prices. Enjoy inline CRUD updates via SQLite database tables.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel glass-panel-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Visual Analytics</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Breakdown asset allocations with Pie charts, check relative profits with Bar charts, and chart growth indices.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel glass-panel-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Live Fluctuation</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Trigger mock market events to watch values adjust. Cells highlight green/red in real-time as prices shift.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel glass-panel-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Professional Exports</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Compile comprehensive CSV matrices or download custom-formatted ReportLab PDF files immediately.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. ABOUT SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h2 className="text-3xl font-bold font-sans text-slate-900 dark:text-white">
            Built as a Premium Full-Stack Portfolio Showcase
          </h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            This project showcases professional full-stack development skills. Combining the speed of a Vite React layout with the security of a Python Flask sqlite server, it models core features expected of modern financial technology.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/30">
              <h4 className="font-extrabold text-2xl text-indigo-600">50ms</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average API Latency</p>
            </div>
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/30">
              <h4 className="font-extrabold text-2xl text-indigo-600">100%</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Responsive Flex Layout</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm glass-panel p-6 border-white/20 dark:border-slate-800/30 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 dark:bg-slate-900/20">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-3">Project Specifications</h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Frontend: React + Tailwind CSS
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                State Management: Context API
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Charts Engine: Recharts Component
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Backend: Flask + SQLAlchemy
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Database: SQLite Instance
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                PDF Reports: ReportLab Engine
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t border-slate-200/50 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">α</div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-400">CodeAlpha Stock Tracker</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center sm:text-right">
            © 2026 CodeAlpha Stock Tracker. Intern Portfolio Project. All mock values.
          </p>
        </div>
      </footer>

      {/* Auth Modal overlay */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        defaultIsRegister={authDefaultRegister}
      />

    </div>
  );
};

export default LandingPage;
