import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { X, CreditCard, Send, CheckCircle, ShieldCheck } from 'lucide-react';

const AddFundsModal = ({ isOpen, onClose }) => {
  const { addFunds } = usePortfolio();
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upi'
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  
  // UPI states
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  // Common payment states
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      clearForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearForm = () => {
    setAmount('');
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setIsFlipped(false);
    setUpiId('');
    setSelectedUpiApp('');
    setError('');
    setLoading(false);
    setIsSuccess(false);
  };

  // Card Brand Detection
  const getCardType = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'mastercard';
    if (clean.startsWith('3')) return 'amex';
    return 'generic';
  };

  // Card Number Formatting: Adds space every 4 digits
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted.substring(0, 19));
  };

  // Expiry Date Formatting: Adds slash after month
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (activeTab === 'card') {
      const cleanCardNum = cardNumber.replace(/\s/g, '');
      if (cleanCardNum.length < 15) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardName.trim()) {
        setError('Cardholder name is required.');
        return;
      }
      if (cardExpiry.length < 5) {
        setError('Expiry date must be in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        setError('CVV must be 3 or 4 digits.');
        return;
      }
    } else {
      if (!upiId.includes('@') && !selectedUpiApp) {
        setError('Please enter a valid UPI ID (e.g. user@okaxis) or select a quick UPI option.');
        return;
      }
    }

    setLoading(true);

    // Simulate Payment Processing API Latency
    try {
      const paymentMethod = activeTab === 'card' 
        ? `${getCardType(cardNumber).toUpperCase()} Card ending in ${cardNumber.slice(-4)}`
        : `UPI (${selectedUpiApp || upiId.split('@')[1] || 'BHIM'})`;

      await addFunds(numAmount, paymentMethod);
      setLoading(false);
      setIsSuccess(true);
      
      // Keep success state open for 2 seconds to show animation
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment simulation failed.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Container */}
      <div className="relative w-full max-w-lg p-6 glass-panel shadow-2xl bg-white/95 dark:bg-slate-900/95 max-h-[95vh] overflow-y-auto transform scale-100 transition-all duration-300 animate-slide-up border border-slate-200 dark:border-slate-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          disabled={loading || isSuccess}
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          // Success Screen
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20 animate-pulse">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Simulated Payment Approved</h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-xs">
                Successfully added <strong className="text-emerald-600 font-bold">${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to your Real Wallet.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 animate-pulse mt-4">Returning to dashboard...</p>
          </div>
        ) : (
          // Form Screen
          <div className="space-y-6">
            
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Simulated Wallet Cash</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Inject virtual "real" money into your account using simulated credit/debit cards or UPI channels.
              </p>
            </div>

            {error && (
              <p className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200/50 dark:border-rose-900/10">
                {error}
              </p>
            )}

            <form onSubmit={handlePay} className="space-y-5">
              
              {/* Wallet Deposit Amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Amount to Fund ($)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5,000"
                    className="w-full pl-8 pr-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-sm focus:outline-none dark:text-white font-bold"
                    required
                  />
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border border-slate-100 dark:border-slate-800 p-1 rounded-xl bg-slate-50 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => { setActiveTab('card'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'card'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Cards (Debit / Credit)
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('upi'); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'upi'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Send className="w-4 h-4" /> UPI Netbanking
                </button>
              </div>

              {/* Tab 1: Cards Option */}
              {activeTab === 'card' && (
                <div className="space-y-4">
                  {/* Premium Credit Card Visualization */}
                  <div className="w-full h-44 perspective-1000 select-none">
                    <div 
                      className={`relative w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-800 text-white p-5 flex flex-col justify-between shadow-xl transition-transform duration-500 transform-style-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Card Front Side */}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between backface-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">REAL WALLET SIMULATOR</span>
                          {/* Chip */}
                          <div className="w-9 h-7 bg-amber-400/20 rounded-md border border-amber-300/30 flex flex-col justify-around p-1">
                            <div className="w-full h-[1.5px] bg-amber-300/20" />
                            <div className="w-full h-[1.5px] bg-amber-300/20" />
                            <div className="w-full h-[1.5px] bg-amber-300/20" />
                          </div>
                        </div>

                        {/* Card Number */}
                        <div className="text-lg sm:text-xl font-bold tracking-[0.15em] text-center font-mono my-2.5">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-indigo-300 block mb-0.5">Cardholder</span>
                            <span className="text-xs uppercase font-semibold font-mono tracking-wider truncate max-w-[150px] inline-block">{cardName || 'YOUR FULL NAME'}</span>
                          </div>
                          <div className="flex items-end gap-5">
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-indigo-300 block mb-0.5">Expires</span>
                              <span className="text-xs font-semibold font-mono">{cardExpiry || 'MM/YY'}</span>
                            </div>
                            {/* Card Issuer Logo */}
                            <span className="text-sm font-black italic tracking-tighter capitalize opacity-85">
                              {getCardType(cardNumber)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Back Side */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-700 to-purple-900 text-white flex flex-col justify-between backface-hidden rotate-y-180 py-5">
                        <div className="w-full h-9 bg-slate-950/70 mt-2" />
                        <div className="px-5 flex items-center justify-end gap-3 mt-4">
                          <span className="text-[8px] uppercase tracking-wider text-indigo-300">CVV</span>
                          <span className="bg-white text-slate-900 px-3 py-1 text-xs font-mono font-bold rounded shadow-inner tracking-widest">{cardCvv || '•••'}</span>
                        </div>
                        <div className="px-5 mt-auto flex items-center justify-between">
                          <ShieldCheck className="w-5 h-5 text-indigo-300/60" />
                          <span className="text-[8px] text-indigo-300/50 uppercase font-mono leading-none">Simulated Secure Protocol</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Controls */}
                  <div className="space-y-3.5">
                    {/* Card Number Input */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:outline-none dark:text-white"
                        required={activeTab === 'card'}
                      />
                    </div>

                    {/* Card Name Input */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:outline-none dark:text-white"
                        required={activeTab === 'card'}
                      />
                    </div>

                    {/* Expiry & CVV Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          onFocus={() => setIsFlipped(false)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:outline-none dark:text-white text-center"
                          required={activeTab === 'card'}
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Security CVV
                        </label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          onFocus={() => setIsFlipped(true)}
                          onBlur={() => setIsFlipped(false)}
                          placeholder="•••"
                          className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:outline-none dark:text-white text-center"
                          required={activeTab === 'card'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: UPI Option */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  {/* Quick Select Buttons */}
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Choose Quick App Option
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['GooglePay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => { setSelectedUpiApp(app); setUpiId(''); setError(''); }}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                            selectedUpiApp === app
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-650 dark:text-indigo-400'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center my-3.5">
                    <span className="absolute bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-450 dark:text-slate-500 uppercase font-semibold">Or enter custom ID</span>
                    <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                  </div>

                  {/* UPI ID Input */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value); setSelectedUpiApp(''); }}
                      placeholder="e.g. username@upi"
                      className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs focus:outline-none dark:text-white"
                      required={activeTab === 'upi' && !selectedUpiApp}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-xs py-2 px-4"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-6 flex items-center gap-1.5 font-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying Payment...
                    </span>
                  ) : (
                    `Pay $${amount ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddFundsModal;
