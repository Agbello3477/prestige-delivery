import api from './api';

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (userData: { name: string; email: string; password: string; phone: string; role: string }) => {
    const response = await api.post('/auth/register', userData);
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
