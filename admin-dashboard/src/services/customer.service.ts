import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/users/customers` : 'http://localhost:4000/api/users/customers';

export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'CUSTOMER';
    isBlocked?: boolean;
    isSuspended?: boolean;
    suspensionEndDate?: string;
    _count?: {
        deliveriesAsCustomer: number;
    };
    createdAt: string;
}

export const getCustomers = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data as Customer[];
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};

export const suspendCustomer = async (customerId: number, duration: number, unit: 'days' | 'weeks' | 'months') => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${customerId}/suspend`, { duration, unit }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error suspending customer ${customerId}`, error);
        throw error;
    }
};

export const blockCustomer = async (customerId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${customerId}/block`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error blocking customer ${customerId}`, error);
        throw error;
    }
};

export const liftCustomerSuspension = async (customerId: number) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/${customerId}/lift-suspension`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error(`Error lifting suspension for customer ${customerId}`, error);
        throw error;
    }
};
