import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { X, DollarSign, Calendar, Hash } from 'lucide-react';

const AddEditStockModal = ({ isOpen, onClose, stockToEdit = null }) => {
  const { addStock, updateStock } = usePortfolio();
  
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill when editing
  useEffect(() => {
    if (stockToEdit) {
      setSymbol(stockToEdit.stock_symbol);
      setCompanyName(stockToEdit.company_name);
      setQuantity(stockToEdit.quantity.toString());
      setBuyPrice(stockToEdit.buy_price.toString());
      setCurrentPrice(stockToEdit.current_price.toString());
      setPurchaseDate(stockToEdit.purchase_date);
    } else {
      clearForm();
    }
  }, [stockToEdit, isOpen]);

  const clearForm = () => {
    setSymbol('');
    setCompanyName('');
    setQuantity('');
    setBuyPrice('');
    setCurrentPrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setError('');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedCompany = companyName.trim();
    const numQuantity = parseFloat(quantity);
    const numBuyPrice = parseFloat(buyPrice);
    const numCurrentPrice = parseFloat(currentPrice);

    // Front-end validations
    if (!trimmedSymbol || trimmedSymbol.length > 10) {
      setError('Stock symbol is required and must be max 10 characters.');
      setLoading(false);
      return;
    }
    if (!trimmedCompany) {
      setError('Company name is required.');
      setLoading(false);
      return;
    }
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('Quantity must be a positive number.');
      setLoading(false);
      return;
    }
    if (isNaN(numBuyPrice) || numBuyPrice <= 0) {
      setError('Buy price must be greater than 0.');
      setLoading(false);
      return;
    }
    if (isNaN(numCurrentPrice) || numCurrentPrice <= 0) {
      setError('Current price must be greater than 0.');
      setLoading(false);
      return;
    }

    const payload = {
      stock_symbol: trimmedSymbol,
      company_name: trimmedCompany,
      quantity: numQuantity,
      buy_price: numBuyPrice,
      current_price: numCurrentPrice,
      purchase_date: purchaseDate || new Date().toISOString().split('T')[0]
    };

    try {
      if (stockToEdit) {
        await updateStock(stockToEdit.id, payload);
      } else {
        await addStock(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit stock entry.');
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

      {/* Form Container */}
      <div className="relative w-full max-w-lg p-6 glass-panel border border-white/30 shadow-2xl dark:border-slate-800/40 transform scale-100 transition-all duration-300 animate-slide-up bg-white/95 dark:bg-slate-900/95 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-xl font-bold font-sans text-slate-900 dark:text-white">
            {stockToEdit ? `Edit holding: ${stockToEdit.stock_symbol}` : 'Add New Stock Holding'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Specify transaction details to update asset values and compute returns.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-450 rounded-lg border border-rose-200/50 dark:border-rose-900/20">
              {error}
            </div>
          )}

          {/* Row 1: Symbol & Company Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Stock Symbol
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL"
                  maxLength={10}
                  className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white uppercase"
                  required
                  disabled={!!stockToEdit} // Symbol is immutable on edit typically
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apple Inc."
                className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                required
              />
            </div>
          </div>

          {/* Row 2: Quantity & Buy Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Buy Price ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="any"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 3: Current Price & Purchase Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Current Price ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="Defaults to buy price"
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Purchase Date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-sm transition-all focus:outline-none dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={stockToEdit ? onClose : clearForm}
              className="btn-secondary text-sm py-2 px-4"
              disabled={loading}
            >
              {stockToEdit ? 'Cancel' : 'Clear Form'}
            </button>
            <button
              type="submit"
              className="btn-primary text-sm py-2 px-6 flex items-center gap-1.5 font-semibold"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                stockToEdit ? 'Save Changes' : 'Add Stock'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddEditStockModal;
