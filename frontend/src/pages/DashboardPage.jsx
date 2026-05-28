import React, { useState, useEffect, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import AddEditStockModal from '../components/AddEditStockModal';
import AIDashboardInsights from '../components/AIDashboardInsights';
import WatchlistWidget from '../components/WatchlistWidget';
import AnalyticsCharts from '../components/AnalyticsCharts';

import { 
  LayoutDashboard, FolderClosed, BarChart4, Download, Settings as SettingsIcon,
  LogOut, Menu, Sun, Moon, Search, Bell, Star,
  TrendingUp, TrendingDown, Edit2, Trash2, Plus, 
  ArrowUpDown, Play, Pause, AlertCircle, RefreshCw
} from 'lucide-react';

const DashboardPage = ({ onNavigateToLanding }) => {
  const { 
    user, stocks, theme, flashStates, logout, deleteStock,
    triggerSimulationTick, exportCSV, exportPDF, toggleTheme, addNotification,
    resetDemo
  } = usePortfolio();

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Add/Edit stock modal state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockToEdit, setStockToEdit] = useState(null);
  
  // Delete confirmation modal state
  const [stockToDelete, setStockToDelete] = useState(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [gainsFilter, setGainsFilter] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [sortField, setSortField] = useState('symbol'); // 'symbol' | 'quantity' | 'investment' | 'value' | 'pl'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Live Simulator state
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(5000); // 5s default

  // Simulator background worker
  useEffect(() => {
    if (!isSimulating || stocks.length === 0) return;
    
    const interval = setInterval(() => {
      triggerSimulationTick();
    }, simulationSpeed);
    
    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, stocks.length]);

  // Overall Portfolio Calculations
  const summary = useMemo(() => {
    const totalInvestment = stocks.reduce((sum, s) => sum + s.total_investment, 0);
    const currentValue = stocks.reduce((sum, s) => sum + s.current_value, 0);
    const totalPL = currentValue - totalInvestment;
    const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;
    
    return {
      totalInvestment,
      currentValue,
      totalPL,
      plPercentage,
      totalCount: stocks.length
    };
  }, [stocks]);

  // Handle Log Out
  const handleLogout = () => {
    logout();
    onNavigateToLanding();
  };

  // Trigger Add Stock Modal
  const handleOpenAddStock = () => {
    setStockToEdit(null);
    setIsStockModalOpen(true);
  };

  // Trigger Edit Stock Modal
  const handleOpenEditStock = (stock) => {
    setStockToEdit(stock);
    setIsStockModalOpen(true);
  };

  // Trigger Delete Stock Modal
  const handleConfirmDelete = (stock) => {
    setStockToDelete(stock);
  };

  const handleDeleteExecute = async () => {
    if (!stockToDelete) return;
    try {
      await deleteStock(stockToDelete.id, stockToDelete.stock_symbol);
      setStockToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Sorting Handler
  const requestSort = (field) => {
    let direction = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtered & Sorted Stocks List
  const filteredSortedStocks = useMemo(() => {
    let list = [...stocks];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => 
          s.stock_symbol.toLowerCase().includes(query) || 
          s.company_name.toLowerCase().includes(query)
      );
    }

    // 2. Gainers / Losers Filter
    if (gainsFilter === 'gainers') {
      list = list.filter((s) => s.profit_loss > 0);
    } else if (gainsFilter === 'losers') {
      list = list.filter((s) => s.profit_loss < 0);
    }

    // 3. Sorting
    list.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'symbol':
          valA = a.stock_symbol;
          valB = b.stock_symbol;
          break;
        case 'quantity':
          valA = a.quantity;
          valB = b.quantity;
          break;
        case 'investment':
          valA = a.total_investment;
          valB = b.total_investment;
          break;
        case 'value':
          valA = a.current_value;
          valB = b.current_value;
          break;
        case 'pl':
          valA = a.profit_loss;
          valB = b.profit_loss;
          break;
        default:
          valA = a.stock_symbol;
          valB = b.stock_symbol;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [stocks, searchQuery, gainsFilter, sortField, sortDirection]);

  // Sidebar Items
  const sidebarItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', name: 'Portfolio Table', icon: FolderClosed },
    { id: 'analytics', name: 'Analytics', icon: BarChart4 },
    { id: 'export', name: 'Export Data', icon: Download },
    { id: 'settings', name: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* ========================================================
          SIDEBAR (Desktop Sticky & Mobile Slide)
      ======================================================== */}
      
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-850 h-screen sticky top-0 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => setActiveMenu('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/10">
              α
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent truncate">
                CodeAlpha<span className="text-indigo-600">Stock</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-16 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile actions bottom */}
        <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/50">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                {user?.username?.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-none">{user?.username}</p>
                <p className="text-[10px] text-slate-450 mt-1 truncate">Portfolio Auditor</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Sidebar Slide-in */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          {/* Content */}
          <aside className="relative flex-1 max-w-[280px] w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col p-4 animate-slide-up">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">α</div>
                <span className="font-extrabold text-base dark:text-white">CodeAlphaStock</span>
              </div>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveMenu(item.id); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600'
                        : 'text-slate-655 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.username?.substring(0, 2)}
                </div>
                <span className="text-sm font-bold dark:text-white">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================
          MAIN WORKSPACE PANELS
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            
            {/* Search Bar for Dashboard Context */}
            <div className="relative max-w-xs w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeMenu !== 'portfolio') setActiveMenu('portfolio');
                }}
                placeholder="Search symbol, company..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs transition-all focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Right Header Panel */}
          <div className="flex items-center gap-3">
            
            {/* Ticker Simulator Toggles */}
            {stocks.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-150/60 dark:bg-slate-850/60 border border-slate-205 dark:border-slate-805 p-1 rounded-xl">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isSimulating 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  title={isSimulating ? "Pause Price Feed Simulator" : "Play Price Feed Simulator"}
                >
                  {isSimulating ? <Play className="w-3.5 h-3.5 fill-white text-emerald-500" /> : <Pause className="w-3.5 h-3.5 text-slate-500" />}
                  <span className="hidden lg:inline text-[10px]">
                    {isSimulating ? 'Simulating' : 'Sim Paused'}
                  </span>
                </button>
                <button
                  onClick={triggerSimulationTick}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Manual Price Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick add stock header trigger */}
            <button
              onClick={handleOpenAddStock}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 font-bold shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-3.5 h-3.5" /> Add Asset
            </button>
          </div>
        </header>

        {/* Dashboard Panels Scroll */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {/* ========================================================
              MENU 1: DASHBOARD OVERVIEW
          ======================================================== */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
                
                {/* 1. Portfolio Valuation Card */}
                <div className="glass-panel p-5 bg-gradient-to-tr from-indigo-500/10 to-transparent border-indigo-500/10 dark:border-indigo-500/20 transform hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Value</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ${summary.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    Portfolio Net Worth
                  </div>
                </div>

                {/* 2. Practice Cash Card */}
                <div className="glass-panel p-5 bg-gradient-to-tr from-emerald-500/10 to-transparent border-emerald-500/10 dark:border-emerald-500/20 transform hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Practice Cash</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ${(user?.demo_balance ?? 100000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2.5 text-[10px] font-bold text-slate-500">
                    Buying Power
                  </div>
                </div>

                {/* 3. Total Investment Card */}
                <div className="glass-panel p-5 transform hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Investment</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    ${summary.totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2.5 text-[10px] font-bold text-slate-500">
                    Invested Principal Cap
                  </div>
                </div>

                {/* 4. Profit / Loss Card */}
                <div className="glass-panel p-5 bg-gradient-to-tr from-transparent to-transparent transform hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Profit / Loss</p>
                  <h3 className={`text-2xl font-black mt-2 flex items-baseline gap-1 ${
                    summary.totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    ${summary.totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs font-semibold">
                      ({summary.plPercentage >= 0 ? '+' : ''}{summary.plPercentage.toFixed(2)}%)
                    </span>
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                    {summary.totalPL >= 0 ? (
                      <span className="text-emerald-600 flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> Gaining positive returns</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-0.5"><TrendingDown className="w-3.5 h-3.5" /> Exposure warning</span>
                    )}
                  </div>
                </div>

                {/* 5. Total Stock Assets Count Card */}
                <div className="glass-panel p-5 transform hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Added Stocks</p>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                    {summary.totalCount}
                  </h3>
                  <div className="mt-2.5 text-[10px] font-bold text-slate-500">
                    Active holdings positions
                  </div>
                </div>

              </div>

              {/* Main row: AI insights + Watchlist panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* AI Insights (Takes 2 cols on wide) */}
                <div className="lg:col-span-2 space-y-6">
                  <AIDashboardInsights />
                  <div className="glass-panel p-5 border border-slate-205 dark:border-slate-805">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="font-extrabold text-sm text-slate-850 dark:text-white">Active Positions Summary</h3>
                      <button 
                        onClick={() => setActiveMenu('portfolio')}
                        className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold"
                      >
                        View Table
                      </button>
                    </div>
                    {stocks.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-450 font-medium">No stock holdings available. Click "Add Asset" to start.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stocks.slice(0, 4).map((stock) => {
                          const isGainer = stock.profit_loss >= 0;
                          return (
                            <div 
                              key={stock.id}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between"
                            >
                              <div>
                                <h4 className="font-bold text-xs text-slate-800 dark:text-white">{stock.stock_symbol}</h4>
                                <p className="text-[9px] text-slate-400">{stock.company_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-xs">${stock.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <span className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                                  isGainer ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                  {isGainer ? '+' : ''}{stock.profit_loss_percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Watchlist Sidebar */}
                <div className="lg:col-span-1">
                  <WatchlistWidget />
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              MENU 2: PORTFOLIO HOLDINGS TABLE
          ======================================================== */}
          {activeMenu === 'portfolio' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Toolbar: Search, Filters, Add Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-205 dark:border-slate-805">
                
                {/* Search query */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks by symbol, name..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs dark:text-white focus:outline-none"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setGainsFilter('all')}
                    className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                      gainsFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All holdings
                  </button>
                  <button
                    onClick={() => setGainsFilter('gainers')}
                    className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                      gainsFilter === 'gainers'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450'
                    }`}
                  >
                    Gainers
                  </button>
                  <button
                    onClick={() => setGainsFilter('losers')}
                    className={`flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                      gainsFilter === 'losers'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450'
                    }`}
                  >
                    Losers
                  </button>
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="glass-panel border border-slate-205 dark:border-slate-805 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                        <th onClick={() => requestSort('symbol')} className="px-5 py-4 cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                          <div className="flex items-center gap-1.5">Symbol <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-5 py-4">Company Name</th>
                        <th onClick={() => requestSort('quantity')} className="px-5 py-4 text-right cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                          <div className="flex items-center justify-end gap-1.5">Quantity <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-5 py-4 text-right">Buy Price</th>
                        <th className="px-5 py-4 text-right">Current Price</th>
                        <th onClick={() => requestSort('investment')} className="px-5 py-4 text-right cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                          <div className="flex items-center justify-end gap-1.5">Total Invested <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th onClick={() => requestSort('value')} className="px-5 py-4 text-right cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                          <div className="flex items-center justify-end gap-1.5">Current Value <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th onClick={() => requestSort('pl')} className="px-5 py-4 text-right cursor-pointer hover:text-slate-800 dark:hover:text-white transition-colors">
                          <div className="flex items-center justify-end gap-1.5">Profit / Loss <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-805">
                      {filteredSortedStocks.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-slate-450 font-medium">
                            {stocks.length === 0 
                              ? 'Your portfolio is empty. Click "Add Asset" to record holdings.'
                              : 'No holdings matched your search parameters.'}
                          </td>
                        </tr>
                      ) : (
                        filteredSortedStocks.map((stock) => {
                          const isGainer = stock.profit_loss >= 0;
                          
                          // Check if cell should flash due to simulated price tick
                          const flash = flashStates[stock.id];
                          let flashClass = '';
                          if (flash === 'up') flashClass = 'animate-flash-green';
                          if (flash === 'down') flashClass = 'animate-flash-red';

                          return (
                            <tr 
                              key={stock.id} 
                              className={`hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-all duration-300 ${flashClass}`}
                            >
                              <td className="px-5 py-4.5 font-bold text-slate-850 dark:text-white">
                                {stock.stock_symbol}
                              </td>
                              <td className="px-5 py-4.5 font-medium text-slate-600 dark:text-slate-350">
                                {stock.company_name}
                              </td>
                              <td className="px-5 py-4.5 text-right font-medium">
                                {stock.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-4.5 text-right font-medium">
                                ${stock.buy_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-4.5 text-right font-semibold">
                                ${stock.current_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-4.5 text-right font-medium">
                                ${stock.total_investment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-4.5 text-right font-bold text-slate-850 dark:text-white">
                                ${stock.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`px-5 py-4.5 text-right font-bold flex items-center justify-end gap-1.5 ${
                                isGainer ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {isGainer ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                <span>
                                  ${stock.profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  <span className="text-[9px] font-semibold block text-right mt-0.5">
                                    {isGainer ? '+' : ''}{stock.profit_loss_percentage.toFixed(2)}%
                                  </span>
                                </span>
                              </td>
                              <td className="px-5 py-4.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditStock(stock)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-slate-205 dark:hover:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleConfirmDelete(stock)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-slate-205 dark:hover:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-500 transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              MENU 3: ANALYTICS VISUALIZATIONS
          ======================================================== */}
          {activeMenu === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <AnalyticsCharts />
            </div>
          )}

          {/* ========================================================
              MENU 4: EXPORT REPORT triggers
          ======================================================== */}
          {activeMenu === 'export' && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-10 text-center flex flex-col items-center">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-sans text-slate-900 dark:text-white">Export Portfolio Records</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                Download structured data audits for tax calculations, backup offline archives, or share performance with financial advisors.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8 max-w-md">
                
                {/* CSV Download Card */}
                <button
                  onClick={exportCSV}
                  disabled={stocks.length === 0}
                  className="glass-panel p-6 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-md hover:border-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none text-slate-800 dark:text-white"
                >
                  <span className="font-extrabold text-sm">Download Spreadsheet (CSV)</span>
                  <span className="text-[10px] text-slate-450 leading-relaxed">Best for MS Excel, Google Sheets, or local database imports.</span>
                  <span className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Generate CSV <ArrowUpDown className="w-3.5 h-3.5" /></span>
                </button>

                {/* PDF Download Card */}
                <button
                  onClick={exportPDF}
                  disabled={stocks.length === 0}
                  className="glass-panel p-6 border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 transition-all duration-300 hover:shadow-md hover:border-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none text-slate-800 dark:text-white"
                >
                  <span className="font-extrabold text-sm">Download PDF Report</span>
                  <span className="text-[10px] text-slate-450 leading-relaxed">Beautifully formatted ReportLab summary grid with P/L highlights.</span>
                  <span className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">Generate Report <TrendingUp className="w-3.5 h-3.5" /></span>
                </button>

              </div>
            </div>
          )}

          {/* ========================================================
              MENU 5: SETTINGS CONFIGURATIONS
          ======================================================== */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              
              <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/70 border border-slate-205 dark:border-slate-805 space-y-6">
                
                {/* Section header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-850 dark:text-white">Workspace Configuration</h3>
                  <p className="text-[10px] text-slate-500">Configure simulated parameters and account preferences</p>
                </div>

                {/* Grid */}
                <div className="space-y-4 text-xs">
                  
                  {/* Simulator Toggles */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/30 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Simulated Live Price Refresh</h4>
                      <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">Toggle background fluctuation of market prices (-1.5% to +1.5% ticks).</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                        disabled={!isSimulating}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl focus:outline-none focus:border-indigo-500 dark:text-white disabled:opacity-50"
                      >
                        <option value={2000}>Every 2 seconds</option>
                        <option value={5000}>Every 5 seconds</option>
                        <option value={10000}>Every 10 seconds</option>
                        <option value={30000}>Every 30 seconds</option>
                      </select>
                      
                      <button
                        onClick={() => setIsSimulating(!isSimulating)}
                        className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
                          isSimulating 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {isSimulating ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Profile info mock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Profile Role</label>
                      <input
                        type="text"
                        value="Intern Stock Auditor"
                        className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-450 select-none pointer-events-none"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Database Store</label>
                      <input
                        type="text"
                        value="SQLite Instance (local_db.db)"
                        className="w-full px-3 py-2 bg-slate-100/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-450 select-none pointer-events-none"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Theme Select */}
                  <div className="flex items-center justify-between p-3 border border-slate-200/50 dark:border-slate-800/30 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
                    <div>
                      <h4 className="font-bold text-slate-850 dark:text-white">Workspace Color Theme</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Toggle interface backdrop between dark modes and light modes.</p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      {theme === 'dark' ? (
                        <><Moon className="w-4 h-4 text-purple-500" /> <span className="font-bold">Dark mode</span></>
                      ) : (
                        <><Sun className="w-4 h-4 text-amber-500" /> <span className="font-bold">Light mode</span></>
                      )}
                    </button>
                  </div>

                  {/* Reset practice panel */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border border-rose-200/50 dark:border-rose-900/10 rounded-xl bg-rose-50/25 dark:bg-rose-950/5 mt-4 animate-fade-in">
                    <div>
                      <h4 className="font-bold text-rose-800 dark:text-rose-400">Reset Practice Account</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Delete all stock asset holdings and reset virtual balance back to $100,000.00.</p>
                    </div>
                    <button
                      onClick={resetDemo}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all whitespace-nowrap self-start sm:self-center"
                    >
                      Reset Portfolio
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ========================================================
          OVERLAYS & MODALS
      ======================================================== */}
      
      {/* 1. Add Stock / Edit Stock Dialog Modal */}
      <AddEditStockModal 
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        stockToEdit={stockToEdit}
      />

      {/* 2. Delete Confirmation Popup Dialog */}
      {stockToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setStockToDelete(null)} />
          <div className="relative w-full max-w-sm p-6 glass-panel border border-white/30 shadow-2xl dark:border-slate-800/40 transform scale-100 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl">
            <div className="flex items-center gap-2.5 text-rose-600 mb-3">
              <AlertCircle className="w-5.5 h-5.5" />
              <h3 className="font-bold text-sm">Delete Stock Asset Position</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-850 dark:text-white font-bold">{stockToDelete.stock_symbol}</strong> holding? This operation is permanent and deletes related SQL rows.
            </p>
            <div className="flex items-center justify-end gap-3.5 mt-6 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setStockToDelete(null)}
                className="btn-secondary text-xs py-1.5 px-4.5"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteExecute}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs py-1.5 px-4.5 rounded-xl transition-all"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
