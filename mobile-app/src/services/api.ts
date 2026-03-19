import axios from 'axios';
import { Platform } from 'react-native';

// API Configuration
const PRODUCTION_URL = 'https://prestige-delivery-backend.onrender.com';
const LOCAL_IP = '192.168.215.60';

// Current backend target (using Production Render to bypass local networking issues)
export const BACKEND_URL = PRODUCTION_URL;


const BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, // Increased to 60s for Render cold starts
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
