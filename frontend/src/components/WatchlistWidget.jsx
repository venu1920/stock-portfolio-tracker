import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Plus, Trash2, TrendingUp, TrendingDown, Star } from 'lucide-react';

const WatchlistWidget = () => {
  const { watchlist, addToWatchlist, deleteFromWatchlist, stocks, activeMode } = usePortfolio();
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Preset suggestions for quick add
  const presets = [
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.50 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.20 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 180.80 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 610.10 }
  ];

  const handleAddCustom = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const sym = symbol.trim().toUpperCase();
    const name = companyName.trim();

    if (!sym || !name) {
      setError('Symbol and company name are required.');
      setLoading(false);
      return;
    }

    // Default mock added price
    const mockPrice = Math.round(50 + Math.random() * 500);

    try {
      await addToWatchlist({
        stock_symbol: sym,
        company_name: name,
        added_price: mockPrice
      });
      setSymbol('');
      setCompanyName('');
    } catch (err) {
      setError(err.message || 'Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreset = async (preset) => {
    setError('');
    try {
      await addToWatchlist({
        stock_symbol: preset.symbol,
        company_name: preset.name,
        added_price: preset.price
      });
    } catch (err) {
      setError(err.message || 'Failed to add preset.');
    }
  };

  return (
    <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200/50 dark:border-slate-800/30">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Watchlist</h3>
          <p className="text-[10px] text-slate-500">Monitor stocks before building active holdings</p>
        </div>
      </div>

      {/* Form to Add Custom Stock to Watchlist */}
      <form onSubmit={handleAddCustom} className="space-y-2 mb-4">
        {error && (
          <p className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={10}
            className="px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs dark:text-white uppercase focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs dark:text-white focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary text-xs py-1.5 flex items-center justify-center gap-1 font-semibold"
        >
          <Plus className="w-3.5 h-3.5" /> Add Custom Symbol
        </button>
      </form>

      {/* Preset Fast Add Suggestions */}
      {presets.some(p => !watchlist.some(w => w.stock_symbol === p.symbol)) && (
        <div className="mb-4">
          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Preset Suggestions</p>
          <div className="flex flex-wrap gap-1.5">
            {presets
              .filter(p => !watchlist.some(w => w.stock_symbol === p.symbol))
              .map(p => (
                <button
                  key={p.symbol}
                  onClick={() => handleAddPreset(p)}
                  className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 flex items-center gap-1 transition-colors"
                >
                  +{p.symbol}
                </button>
              ))
            }
          </div>
        </div>
      )}

      {/* Watchlist Items List */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {watchlist.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Watchlist is empty</p>
          </div>
        ) : (
          watchlist.map((item) => {
            // Match with active stock holdings if symbol matches and is in active mode
            const matchingStock = stocks.find(s => s.stock_symbol === item.stock_symbol && s.is_real === (activeMode === 'real'));
            // Simulate a price movement (e.g. current price is matching stock price or calculated mock current)
            const currentPrice = matchingStock ? matchingStock.current_price : item.added_price * 1.02; // Mock shift
            const pctChange = item.added_price ? ((currentPrice - item.added_price) / item.added_price) * 100 : 0;
            const isPositive = pctChange >= 0;

            return (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400">
                    {item.stock_symbol.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none flex items-center gap-1">
                      {item.stock_symbol}
                      {matchingStock && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Owned" />}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate max-w-[100px] mt-0.5" title={item.company_name}>
                      {item.company_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <span className={`text-[9px] font-bold flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {isPositive ? '+' : ''}{pctChange.toFixed(1)}%
                    </span>
                  </div>
                  
                  <button
                    onClick={() => deleteFromWatchlist(item.id, item.stock_symbol)}
                    className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default WatchlistWidget;
