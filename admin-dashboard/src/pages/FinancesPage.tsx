import React, { useState, useEffect, useCallback } from 'react';
import { 
    TrendingUp, 
    DollarSign, 
    Users, 
    ArrowUpRight, 
    Filter, 
    Calendar,
    Download,
    Loader2
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import { getFinanceStats, FinanceStats, FinanceFilters } from '../services/finance.service';
import { getPartners, Partner } from '../services/partner.service';
import { getRiders, Rider } from '../services/rider.service';

const FinancesPage: React.FC = () => {
    const [stats, setStats] = useState<FinanceStats | null>(null);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FinanceFilters>({
        timeframe: 'month'
    });

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getFinanceStats(filters);
            setStats(data);
        } catch (error) {
            console.error('Error fetching finance stats:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchInitialData = useCallback(async () => {
        try {
            const [partnersData, ridersData] = await Promise.all([
                getPartners(),
                getRiders()
            ]);
            setPartners(partnersData);
            setRiders(ridersData);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchStats();
    }, [filters, fetchStats]);


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(value);
    };

    const handleDownloadReport = () => {
        alert('Report generation started. Your download will begin shortly.');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finances & Revenues</h1>
                    <p className="text-gray-500 font-medium">Track your platform's financial health and payouts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        Export Report
                    </button>
                    <div className="h-10 w-[1px] bg-gray-200 mx-1 hidden md:block" />
                    <select 
                        title="Select Timeframe"
                        value={filters.timeframe}
                        onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as FinanceFilters['timeframe'] })}
                        className="bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold border-none ring-offset-2 focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer shadow-lg shadow-brand-500/20"
                    >
                        <option value="day">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Filters:</span>
                </div>
                
                <select 
                    title="Filter by Partner"
                    value={filters.partnerId || ''}
                    onChange={(e) => setFilters({ ...filters, partnerId: e.target.value || undefined })}
                    className="flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                    <option value="">All Partners</option>
                    {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.partnerProfile?.businessName || p.name}</option>
                    ))}
                </select>

                <select 
                    title="Filter by Rider"
                    value={filters.riderId || ''}
                    onChange={(e) => setFilters({ ...filters, riderId: e.target.value || undefined })}
                    className="flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                    <option value="">All Riders</option>
                    {riders.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>

                <button 
                    onClick={() => setFilters({ timeframe: 'month' })}
                    className="text-gray-400 hover:text-brand-600 text-xs font-bold uppercase transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        label: 'Gross Revenue', 
                        value: stats?.summary.totalRevenue || 0, 
                        icon: DollarSign, 
                        color: 'text-blue-600', 
                        bg: 'bg-blue-50',
                        trend: '+12.5%'
                    },
                    { 
                        label: 'Net Profit', 
                        value: stats?.summary.totalProfit || 0, 
                        icon: TrendingUp, 
                        color: 'text-brand-600', 
                        bg: 'bg-brand-50',
                        trend: '+8.2%'
                    },
                    { 
                        label: 'Rider Payouts', 
                        value: stats?.summary.riderPayouts || 0, 
                        icon: ArrowUpRight, 
                        color: 'text-orange-600', 
                        bg: 'bg-orange-50',
                        trend: '+5.4%'
                    },
                    { 
                        label: 'Partner Payouts', 
                        value: stats?.summary.partnerPayouts || 0, 
                        icon: Users, 
                        color: 'text-purple-600', 
                        bg: 'bg-purple-50',
                        trend: '+2.1%'
                    }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full opacity-50 -mr-6 -mt-6 group-hover:scale-110 transition-transform`} />
                        <card.icon className={`mb-4 ${card.color}`} size={24} />
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{card.label}</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{formatCurrency(card.value)}</p>
                        <div className="flex items-center gap-1 mt-4 text-[10px] font-black text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
                            <TrendingUp size={10} />
                            {card.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue Performance</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Inflow vs Platform Fees</p>
                        </div>
                        <Calendar className="text-gray-300" size={20} />
                    </div>
                    
                    <div className="h-[400px] w-full">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-brand-500" size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.chartData || []}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(val) => `₦${val/1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '13px', fontWeight: 800 }}
                                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 700 }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#0ea5e9" 
                                        fillOpacity={1} 
                                        fill="url(#colorRevenue)" 
                                        strokeWidth={3}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="profit" 
                                        stroke="#0284c7" 
                                        fillOpacity={1} 
                                        fill="url(#colorProfit)" 
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-brand-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                    
                    <h3 className="text-xl font-black mb-1 tracking-tight">Payout Breakdown</h3>
                    <p className="text-brand-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Share of total inflow</p>

                    <div className="space-y-6 relative z-10">
                        {[
                            { label: 'Partners share', value: stats?.summary.partnerPayouts || 0, color: 'bg-indigo-400' },
                            { label: 'Riders share', value: stats?.summary.riderPayouts || 0, color: 'bg-sky-400' },
                            { label: 'Prestige Take', value: stats?.summary.totalProfit || 0, color: 'bg-emerald-400' }
                        ].map((item: { label: string; value: number; color: string }, i) => {
                            const percentage = stats?.summary.totalRevenue 
                                ? Math.round((item.value / stats.summary.totalRevenue) * 100) 
                                : 0;
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-brand-100">{item.label}</span>
                                        <span className="text-lg font-black">{percentage}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-brand-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${item.color} transition-all duration-1000 ease-out`} 
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-[10px] text-brand-400 font-black">{formatCurrency(item.value)}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 p-4 bg-brand-800/50 rounded-2xl border border-brand-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-700/50 rounded-lg">
                                <DollarSign className="text-brand-300" size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest leading-none">Total Processed</p>
                                <p className="text-lg font-black mt-1">{formatCurrency(stats?.summary.totalRevenue || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Entity Table (Simplified) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Activity Details</h3>
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total Items: {stats?.summary.orderCount || 0}
                    </div>
                </div>
                <div className="p-8 text-center text-gray-400 italic font-medium">
                    Detailed line items and export options are available in the reconciliation portal.
                </div>
            </div>
        </div>
    );
};

export default FinancesPage;
