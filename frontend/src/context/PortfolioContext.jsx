import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, stockService, watchlistService } from '../services/api';

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [flashStates, setFlashStates] = useState({}); // { stockId: 'up' | 'down' }
  const [activeMode, setActiveMode] = useState(localStorage.getItem('activeMode') || 'practice');

  useEffect(() => {
    localStorage.setItem('activeMode', activeMode);
  }, [activeMode]);

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth state check on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.me()
        .then((data) => {
          setUser(data.user);
          refreshPortfolioData();
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [{ id, message, type }, ...prev].slice(0, 5));
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      addNotification(`Welcome back, ${data.user.username}!`, 'success');
      
      // Fetch user's data
      const [fetchedStocks, fetchedWatchlist] = await Promise.all([
        stockService.getAll(),
        watchlistService.getAll()
      ]);
      setStocks(fetchedStocks);
      setWatchlist(fetchedWatchlist);
      return data.user;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Login failed';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.register(username, password);
      addNotification('Account created! Logging you in...', 'success');
      return await login(username, password);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Registration failed';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setStocks([]);
    setWatchlist([]);
    addNotification('Logged out successfully.', 'info');
  };

  const refreshPortfolioData = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const [fetchedStocks, fetchedWatchlist] = await Promise.all([
        stockService.getAll(),
        watchlistService.getAll()
      ]);
      setStocks(fetchedStocks);
      setWatchlist(fetchedWatchlist);
    } catch (error) {
      console.error('Failed to fetch portfolio data', error);
    }
  };

  // Stock CRUD
  const addStock = async (stockData) => {
    try {
      const payload = { ...stockData, is_real: activeMode === 'real' };
      const response = await stockService.add(payload);
      setStocks((prev) => [...prev, response.stock]);
      setUser(response.user);
      addNotification(`Added ${response.stock.stock_symbol} to portfolio.`, 'success');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to add stock';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  const updateStock = async (id, stockData) => {
    try {
      const response = await stockService.update(id, stockData);
      setStocks((prev) => prev.map((s) => s.id === id ? response.stock : s));
      setUser(response.user);
      addNotification(`Updated ${response.stock.stock_symbol} holding.`, 'success');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to update stock';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  const deleteStock = async (id, symbol) => {
    try {
      const response = await stockService.delete(id);
      setStocks((prev) => prev.filter((s) => s.id !== id));
      setUser(response.user);
      addNotification(`Sold ${symbol} at current market valuation.`, 'info');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to delete stock';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  const resetDemo = async () => {
    try {
      const response = await authService.resetDemo();
      setStocks([]);
      setUser(response.user);
      addNotification('Practice portfolio and demo balance reset successfully!', 'success');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to reset portfolio';
      addNotification(errMsg, 'error');
    }
  };

  // Watchlist CRUD
  const addToWatchlist = async (itemData) => {
    try {
      const newItem = await watchlistService.add(itemData);
      setWatchlist((prev) => [...prev, newItem]);
      addNotification(`Added ${newItem.stock_symbol} to Watchlist.`, 'success');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to add to watchlist';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  const deleteFromWatchlist = async (id, symbol) => {
    try {
      await watchlistService.delete(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
      addNotification(`Removed ${symbol} from Watchlist.`, 'info');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to remove watchlist item';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  // Live Price Simulation Tick Handler
  const triggerSimulationTick = async () => {
    if (stocks.length === 0) return;
    try {
      const result = await stockService.simulateTick();
      const updatedList = result.stocks;
      
      // Calculate differences for flashes
      const newFlashStates = {};
      updatedList.forEach((newStock) => {
        const oldStock = stocks.find((s) => s.id === newStock.id);
        if (oldStock) {
          if (newStock.current_price > oldStock.current_price) {
            newFlashStates[newStock.id] = 'up';
          } else if (newStock.current_price < oldStock.current_price) {
            newFlashStates[newStock.id] = 'down';
          }
        }
      });

      // Apply flash state
      setFlashStates(newFlashStates);
      setStocks(updatedList);
      
      // Clear flash states after animation finishes (1.5s)
      setTimeout(() => {
        setFlashStates({});
      }, 1500);

    } catch (error) {
      console.error('Simulation tick failed', error);
    }
  };

  // Export handlers
  const exportCSV = async () => {
    try {
      await stockService.downloadCSV(activeMode === 'real');
      addNotification('CSV exported and download started.', 'success');
    } catch (error) {
      addNotification('Failed to export CSV.', 'error');
    }
  };

  const exportPDF = async () => {
    try {
      await stockService.downloadPDF(activeMode === 'real');
      addNotification('PDF exported and download started.', 'success');
    } catch (error) {
      addNotification('Failed to export PDF.', 'error');
    }
  };

  const addFunds = async (amount, paymentMethod) => {
    try {
      const response = await authService.addFunds(amount, paymentMethod);
      setUser(response.user);
      addNotification(`Successfully added $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} to your Real Wallet!`, 'success');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to add funds';
      addNotification(errMsg, 'error');
      throw new Error(errMsg);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <PortfolioContext.Provider
      value={{
        user,
        stocks,
        watchlist,
        loading,
        theme,
        notifications,
        flashStates,
        login,
        register,
        logout,
        addStock,
        updateStock,
        deleteStock,
        addToWatchlist,
        deleteFromWatchlist,
        triggerSimulationTick,
        exportCSV,
        exportPDF,
        toggleTheme,
        addNotification,
        resetDemo,
        activeMode,
        setActiveMode,
        addFunds
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
