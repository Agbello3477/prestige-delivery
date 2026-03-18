import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/users/riders` : 'http://localhost:4000/api/users/riders';
export interface Rider {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'RIDER';
    isVerified: boolean;
    isRejected?: boolean;
    rejectionReason?: string;
    rating?: number;
    ratingCount?: number;
    nin?: string;
    address?: string;
    stateOfOrigin?: string;
    passportUrl?: string;
    ninSlipUrl?: string;
    isBlocked?: boolean;
    isSuspended?: boolean;
    suspensionEndDate?: string;
    approvedBy?: { name: string };
    approvedAt?: string;
    declinedBy?: { name: string };
    declinedAt?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    guarantor?: {
        name: string;
        phone: string;
        address: string;
        relationship: string;
        nin: string;
    };
    vehicles?: {
        type: string;
        plateNumber: string;
        model: string;
        chassisNumber?: string;
    }[];
}

export const getRiders = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data as Rider[];
    } catch (error) {
        console.error('Error fetching riders:', error);
        throw error;
    }
};

export const verifyRider = async (riderId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/${riderId}/approve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error verifying rider ${riderId}`, error);
        throw error;
    }
};

export const declineRider = async (riderId: number, reason: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/decline`, { reason }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error declining rider ${riderId}`, error);
        throw error;
    }
};

export const assignBikeToRider = async (riderId: number, plateNumber: string, model: string, chassisNumber?: string) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/assign-bike`, { plateNumber, model, chassisNumber }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error assigning bike to rider ${riderId}`, error);
        throw error;
    }
};

export const notifyRiderNoBike = async (riderId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/notify-no-bike`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error notifying rider ${riderId} about no bikes`, error);
        throw error;
    }
};

export const getRiderAnalytics = async (riderId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/${riderId}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching analytics for rider ${riderId}`, error);
        throw error;
    }
};

export const getReconciliationReport = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/reconciliation`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching reconciliation report`, error);
        throw error;
    }
};

export const suspendRider = async (riderId: number, duration: number, unit: 'days' | 'weeks' | 'months') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/suspend`, { duration, unit }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error suspending rider ${riderId}`, error);
        throw error;
    }
};

export const blockRider = async (riderId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/block`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error blocking rider ${riderId}`, error);
        throw error;
    }
};

export const liftSuspension = async (riderId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${riderId}/lift-suspension`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error lifting suspension for rider ${riderId}`, error);
        throw error;
    }
};
