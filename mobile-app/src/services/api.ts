import axios from 'axios';
import { Platform } from 'react-native';

// Use production URL if deployed, otherwise fall back to local LAN IP
const PRODUCTION_URL = 'https://prestige-delivery-backend.onrender.com';
export const BACKEND_URL = PRODUCTION_URL || 'http://172.20.10.2:4000';
const BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
