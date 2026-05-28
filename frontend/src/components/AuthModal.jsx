import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { X, Lock, User as UserIcon } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, defaultIsRegister = false }) => {
  const { login, register } = usePortfolio();
  const [isRegister, setIsRegister] = useState(defaultIsRegister);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Both fields are required.');
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (trimmedUser.length < 3) {
        setError('Username must be at least 3 characters.');
        setLoading(false);
        return;
      }
      if (trimmedPass.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegister) {
        await register(trimmedUser, trimmedPass);
      } else {
        await login(trimmedUser, trimmedPass);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md p-6 glass-panel border border-white/30 shadow-2xl dark:border-slate-800/40 transform scale-100 transition-all duration-300 animate-slide-up bg-white/90 dark:bg-slate-900/90">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-800 dark:text-white">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isRegister ? 'Sign up to start tracking your stocks' : 'Access your professional stock portfolio'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg border border-rose-200/50 dark:border-rose-900/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'At least 6 characters' : 'Enter password'}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 mt-2 font-semibold text-sm flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              isRegister ? 'Create Account' : 'Log In'
            )}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => { setIsRegister(false); setError(''); }}
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold transition-colors"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              New to CodeAlpha?{' '}
              <button 
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold transition-colors"
              >
                Create an account
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
