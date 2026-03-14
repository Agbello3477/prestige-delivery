import api from './api';

export const getDashboardStats = async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
};
