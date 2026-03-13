
import api from './api';

export const userService = {
    updateLocation: async (lat: number, lng: number) => {
        try {
            const response = await api.patch('/users/location', { lat, lng });
            return response.data;
        } catch (error) {
            console.error('Error updating location:', error);
            throw error;
        }
    },

    getOnlineRiders: async () => {
        try {
            const response = await api.get('/users/riders/online');
            return response.data;
        } catch (error) {
            console.error('Error fetching online riders:', error);
            throw error;
        }
    }
};
