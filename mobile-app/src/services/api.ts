import axios from 'axios';
import { Platform } from 'react-native';

// Use 172.20.10.2 (Current LAN IP)
export const BACKEND_URL = 'http://172.20.10.2:4000';
const BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
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
