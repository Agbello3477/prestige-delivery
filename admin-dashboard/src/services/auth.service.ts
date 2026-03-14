import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth` : 'http://localhost:4000/api/auth';

export const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
};

export const register = async (userData: { name: string; email: string; password: string; phone: string; role: string }) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    try {
        const user = localStorage.getItem('user');
        return user && user !== 'undefined' ? JSON.parse(user) : null;
    } catch {
        localStorage.removeItem('user');
        return null;
    }
};
