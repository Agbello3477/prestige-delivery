import axios from 'axios';

const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const BASE_URL = apiURL.endsWith('/api') ? apiURL.slice(0, -4) : apiURL;

const api = axios.create({
    baseURL: apiURL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
