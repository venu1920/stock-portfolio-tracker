import React, { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area 
} from 'recharts';

const AnalyticsCharts = () => {
  const { stocks, activeMode } = usePortfolio();

  // Filter stocks by activeMode
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => s.is_real === (activeMode === 'real'));
  }, [stocks, activeMode]);

  // Premium colors
  const COLORS = [
    '#4F46E5', // Indigo
    '#9333EA', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#3B82F6'  // Blue
  ];

  // 1. Pie Chart Allocation Data
  const pieData = useMemo(() => {
    if (filteredStocks.length === 0) return [];
    return filteredStocks.map((s) => ({
      name: s.stock_symbol,
      value: s.current_value
    }));
  }, [filteredStocks]);

  // 2. Bar Chart Investment vs Valuation Data
  const barData = useMemo(() => {
    if (filteredStocks.length === 0) return [];
    return filteredStocks.map((s) => ({
      name: s.stock_symbol,
      Investment: s.total_investment,
      Valuation: s.current_value
    }));
  }, [filteredStocks]);

  // 3. Area Chart Weekly Growth Curve Simulation
  const growthData = useMemo(() => {
    const totalVal = filteredStocks.reduce((sum, s) => sum + s.current_value, 0);
    const totalInv = filteredStocks.reduce((sum, s) => sum + s.total_investment, 0);

    const baseValue = totalInv > 0 ? totalInv : 10000;
    const targetValue = totalVal > 0 ? totalVal : 11200;

    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const pct = (6 - i) / 6;
      // Add slight sinusoid + random fluctuations to simulate a real growth curve
      const swing = Math.sin(pct * Math.PI) * 0.04 + ((i * 12345 % 7) / 100 - 0.035);
      const val = baseValue + (targetValue - baseValue) * pct * (1 + swing);
      data.push({
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Value: Number(val.toFixed(2))
      });
    }
    return data;
  }, [filteredStocks]);

  // Custom tooltips for premium styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
          {label && <p className="font-bold text-slate-400 border-b border-slate-800 pb-1 mb-1">{label}</p>}
          {payload.map((entry, index) => (
            <p key={index} className="font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: <span className="font-bold text-white">${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (filteredStocks.length === 0) {
    return (
      <div className="glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[300px] border-dashed border-slate-300 dark:border-slate-800">
        <p className="text-slate-400 text-sm font-medium">Add stocks to generate analytics charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Grow Area Chart + Distribution Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Curve */}
        <div className="lg:col-span-2 glass-panel p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
          <div className="mb-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Portfolio Growth Simulation</h3>
            <p className="text-[10px] text-slate-500">Estimated valuation curve over the past 7 calendar days</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800/50" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Value" name="Portfolio Value" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Distribution Pie */}
        <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
          <div className="mb-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Holdings Allocation</h3>
            <p className="text-[10px] text-slate-500">Relative asset concentration percentages</p>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Overlay Info inside donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Stocks</span>
              <span className="text-xl font-black text-slate-800 dark:text-white">{filteredStocks.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bar Chart: Investment vs Valuation */}
      <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
        <div className="mb-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Initial Investment vs. Market Valuation</h3>
          <p className="text-[10px] text-slate-500">Asset-by-asset comparison of capital purchase vs. current pricing value</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800/50" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="Investment" name="Total Invested ($)" fill="#9333EA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Valuation" name="Current Value ($)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsCharts;
