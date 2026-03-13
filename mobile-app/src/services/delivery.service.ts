import api from './api';

export interface CreateDeliveryData {
    pickupAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffAddress: string;
    dropoffLat?: number;
    dropoffLng?: number;
    vehicleType: 'BIKE' | 'CAR' | 'VAN';
    pickupDate?: string;
}

export const deliveryService = {
    createDelivery: async (data: CreateDeliveryData) => {
        const response = await api.post('/deliveries', data);
        return response.data;
    },

    getEstimate: async (data: CreateDeliveryData) => {
        // Enforce the N1200 to N1500 range
        let basePrice = 1200;
        if (data.vehicleType === 'CAR') basePrice = 1300;
        if (data.vehicleType === 'VAN') basePrice = 1400;

        // Add slight random fluctuation but strictly clip to boundaries
        let calculatedPrice = basePrice + Math.floor(Math.random() * 200);
        calculatedPrice = Math.max(1200, Math.min(1500, calculatedPrice)); // Clamp between 1200 and 1500

        return {
            price: calculatedPrice,
            distance: '5.2 km', // Mock distance
            duration: '15 mins' // Mock duration
        };
    },

    getDeliveryById: async (id: string) => {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    getPendingDeliveries: async () => {
        const response = await api.get('/deliveries/pending');
        return response.data;
    },

    updateDeliveryStatus: async (id: string, status: string) => {
        const response = await api.patch(`/deliveries/${id}/status`, { status });
        return response.data;
    },

    getMyDeliveries: async () => {
        const response = await api.get('/deliveries/my-deliveries');
        return response.data;
    },

    updateLocation: async (id: string, lat: number, lng: number) => {
        const response = await api.patch(`/deliveries/${id}/location`, { lat, lng });
        return response.data;
    },

    cancelDelivery: async (id: string) => {
        const response = await api.post(`/deliveries/${id}/cancel`);
        return response.data;
    },

    rateDelivery: async (id: string, rating: number) => {
        const response = await api.post(`/deliveries/${id}/rate`, { rating });
        return response.data;
    }
};
