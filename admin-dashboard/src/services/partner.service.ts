import api from './api';

export interface Partner {
    id: number;
    name: string;
    email: string;
    phone: string;
    isVerified: boolean;
    createdAt: string;
    partnerProfile?: {
        partnerType: 'FOOD' | 'ECOMMERCE' | 'PHARMACY' | 'AUTOMOBILE';
        businessName: string;
        address: string | null;
        agreedPercentage: number | null;
        isActive: boolean;
    };
}

export const getPartners = async (): Promise<Partner[]> => {
    const response = await api.get('/partners');
    return response.data;
};

export interface PublicPartner {
    id: number;
    name: string;
    partnerProfile: {
        id: number;
        businessName: string;
        partnerType: string;
        address: string | null;
    };
}

export const getPublicPartners = async (type?: string): Promise<PublicPartner[]> => {
    const params = type ? `?type=${type}` : '';
    const response = await api.get(`/partners/public${params}`);
    return response.data;
};
