import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Sparkles, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';

const AIDashboardInsights = () => {
  const { stocks, activeMode } = usePortfolio();

  const filteredStocks = useMemo(() => {
    return stocks.filter(s => s.is_real === (activeMode === 'real'));
  }, [stocks, activeMode]);

  const insights = useMemo(() => {
    if (filteredStocks.length === 0) {
      return [
        {
          id: 'empty',
          type: 'info',
          message: 'Add your first stock holding to unlock AI-powered portfolio diversification insights and alerts.',
          title: 'Unlock AI Insights'
        }
      ];
    }

    const list = [];
    
    // Calculate total values
    const totalInv = filteredStocks.reduce((sum, s) => sum + s.total_investment, 0);
    const totalVal = filteredStocks.reduce((sum, s) => sum + s.current_value, 0);
    const totalPL = totalVal - totalInv;
    const plPercentage = totalInv > 0 ? (totalPL / totalInv) * 100 : 0;

    // Rule 1: Diversification Check (Number of assets)
    if (filteredStocks.length < 3) {
      list.push({
        id: 'diversification-count',
        type: 'warning',
        title: 'Low Asset Diversity',
        message: `You hold only ${filteredStocks.length} asset${filteredStocks.length === 1 ? '' : 's'}. Consider expanding to 4-5 different sectors (e.g. Energy, Healthcare, Tech) to reduce volatility.`
      });
    }

    // Rule 2: Concentration Check (Single stock representing > 40%)
    filteredStocks.forEach((s) => {
      const concentration = totalVal > 0 ? (s.current_value / totalVal) * 100 : 0;
      if (concentration > 40) {
        list.push({
          id: `concentration-${s.id}`,
          type: 'danger',
          title: `High Concentration: ${s.stock_symbol}`,
          message: `Your position in ${s.stock_symbol} represents ${concentration.toFixed(1)}% of your total portfolio value. A sharp drop could severely impact your wealth. Consider trimming.`
        });
      }
    });

    // Rule 3: Profit Taker Suggestion
    filteredStocks.forEach((s) => {
      if (s.profit_loss_percentage > 20) {
        list.push({
          id: `profit-take-${s.id}`,
          type: 'success',
          title: `Lock-in Profit: ${s.stock_symbol}`,
          message: `${s.stock_symbol} has gained +${s.profit_loss_percentage.toFixed(1)}% since purchase. It might be a wise tactical decision to take partial profits (e.g., sell 25% of holdings) to secure gains.`
        });
      }
    });

    // Rule 4: Stop Loss / Risk Warning
    filteredStocks.forEach((s) => {
      if (s.profit_loss_percentage < -15) {
        list.push({
          id: `risk-warn-${s.id}`,
          type: 'danger',
          title: `Loss Exposure: ${s.stock_symbol}`,
          message: `${s.stock_symbol} has declined ${s.profit_loss_percentage.toFixed(1)}% from your buy price. Review if the core business thesis remains intact or evaluate stop-loss parameters.`
        });
      }
    });

    // Rule 5: Overall Portfolio Performance
    if (plPercentage > 10) {
      list.push({
        id: 'portfolio-gains',
        type: 'success',
        title: 'Outstanding Performance',
        message: `Your portfolio shows a strong net gain of +${plPercentage.toFixed(1)}% ($${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Maintain your disciplined approach!`
      });
    }

    // Default if everything is fine and no warning triggered
    if (list.length === 0) {
      list.push({
        id: 'portfolio-healthy',
        type: 'info',
        title: 'Balanced Portfolio Status',
        message: 'Your holdings meet core diversification rules. Ensure you rebalance quarterly to align with target allocations.',
        icon: TrendingUp
      });
    }

    return list;
  }, [filteredStocks]);

  return (
    <div className="glass-panel p-5 border border-indigo-500/10 dark:border-indigo-500/20 relative overflow-hidden bg-gradient-to-tr from-indigo-50/50 via-white/70 to-purple-50/50 dark:from-indigo-950/20 dark:via-slate-900/70 dark:to-purple-950/15">
      {/* Background glow decorator */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1">
            AI Portfolio Insights <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">v1.2</span>
          </h3>
          <p className="text-[10px] text-slate-500">Automated algorithmic analysis of holdings risk matrix</p>
        </div>
      </div>

      {/* Suggestion List */}
      <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
        {insights.map((item) => {
          let alertBorder = 'border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40';
          let bulletColor = 'bg-blue-500';
          let textColor = 'text-slate-600 dark:text-slate-300';

          if (item.type === 'warning') {
            alertBorder = 'border-amber-200/50 dark:border-amber-800/10 bg-amber-50/40 dark:bg-amber-950/10';
            bulletColor = 'bg-amber-500';
          } else if (item.type === 'danger') {
            alertBorder = 'border-rose-200/50 dark:border-rose-800/10 bg-rose-50/40 dark:bg-rose-950/10';
            bulletColor = 'bg-rose-500';
          } else if (item.type === 'success') {
            alertBorder = 'border-emerald-200/50 dark:border-emerald-800/10 bg-emerald-50/40 dark:bg-emerald-950/10';
            bulletColor = 'bg-emerald-500';
          }

          return (
            <div 
              key={item.id} 
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-300 hover:shadow-sm ${alertBorder}`}
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${bulletColor}`} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-none">
                  {item.title}
                </h4>
                <p className={`text-xs leading-relaxed ${textColor}`}>
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIDashboardInsights;
