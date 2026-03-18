import axios from 'axios';
import { Platform } from 'react-native';

// Use production URL if deployed, otherwise fall back to local LAN IP
// Use production URL if deployed, otherwise fall back to local LAN IP
const PRODUCTION_URL = 'https://prestige-delivery-backend.onrender.com';
const LOCAL_IP = '192.168.215.60'; // Your host machine IP

// Using LOCAL_IP for both platforms is often more reliable for Physical Device + Emulator testing
export const BACKEND_URL = __DEV__ 
    ? `http://${LOCAL_IP}:4000` 
    : PRODUCTION_URL;

// If you are strictly using the Android Emulator and LOCAL_IP fails, you can use:
// export const BACKEND_URL = __DEV__ ? 'http://10.0.2.2:4000' : PRODUCTION_URL;


const BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;
