import api from './api';

export interface FinanceSummary {
    totalRevenue: number;
    totalProfit: number;
    riderPayouts: number;
    partnerPayouts: number;
    orderCount: number;
}

export interface ChartDataItem {
    date: string;
    revenue: number;
    profit: number;
}

export interface FinanceStats {
    summary: FinanceSummary;
    chartData: ChartDataItem[];
    filters: {
        timeframe: string;
        startDate: string;
        endDate: string;
    };
}

export interface FinanceFilters {
    timeframe?: 'day' | 'week' | 'month' | 'year';
    partnerId?: string;
    riderId?: string;
}

export const getFinanceStats = async (filters: FinanceFilters = {}): Promise<FinanceStats> => {
    const params = new URLSearchParams();
    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    if (filters.partnerId) params.append('partnerId', filters.partnerId);
    if (filters.riderId) params.append('riderId', filters.riderId);

    const response = await api.get(`/stats/finances?${params.toString()}`);
    return response.data;
};
