import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/deliveries` : 'http://localhost:4000/api/deliveries';
export interface Delivery {
    id: string;
    trackingNumber?: string;
    pickupAddress: string;
    dropoffAddress: string;
    status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
    price?: number;
    distanceKm?: number;
    paymentMethod?: 'COD' | 'TRANSFER' | 'POS';
    createdAt: string;
    customer: {
        name: string;
        phone: string;
    };
    proofType?: 'SIGNATURE' | 'VIDEO';
    proofUrl?: string;
    rider?: {
        name: string;
    };
}

export const getDeliveries = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data as Delivery[];
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        throw error;
    }
};
