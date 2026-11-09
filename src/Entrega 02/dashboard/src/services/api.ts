import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333', // O endereço do seu backend local
});

// Intercetor para injetar o token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@SmartTennis:token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);