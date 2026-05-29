import axios from 'axios';

const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:5000/api';
  
  // Clean trailing slashes
  url = url.replace(/\/+$/, "");
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  return `https://${url}/api`;
};

const API = axios.create({
  baseURL: getBaseURL(),
});

// Interceptor to attach auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: async (username, password) => {
    const response = await API.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username, password) => {
    const response = await API.post('/auth/register', { username, password });
    return response.data;
  },
  me: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },
  resetDemo: async () => {
    const response = await API.post('/auth/reset-demo');
    return response.data;
  },
  addFunds: async (amount, payment_method) => {
    const response = await API.post('/auth/add-funds', { amount, payment_method });
    return response.data;
  }
};

export const stockService = {
  getAll: async () => {
    const response = await API.get('/stocks');
    return response.data;
  },
  add: async (stockData) => {
    const response = await API.post('/stocks', stockData);
    return response.data;
  },
  update: async (id, stockData) => {
    const response = await API.put(`/stocks/${id}`, stockData);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/stocks/${id}`);
    return response.data;
  },
  simulateTick: async () => {
    const response = await API.post('/stocks/simulate-tick');
    return response.data;
  },
  downloadCSV: (isReal = false) => {
    const token = localStorage.getItem('token');
    const url = `${API.defaults.baseURL}/stocks/export/csv?is_real=${isReal}`;
    // Standard fetch + download to properly send headers
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `portfolio_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    });
  },
  downloadPDF: (isReal = false) => {
    const token = localStorage.getItem('token');
    const url = `${API.defaults.baseURL}/stocks/export/pdf?is_real=${isReal}`;
    return fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `portfolio_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    });
  }
};

export const watchlistService = {
  getAll: async () => {
    const response = await API.get('/watchlist');
    return response.data;
  },
  add: async (itemData) => {
    const response = await API.post('/watchlist', itemData);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/watchlist/${id}`);
    return response.data;
  }
};

export default API;
