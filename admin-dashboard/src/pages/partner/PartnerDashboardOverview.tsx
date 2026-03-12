import { useAuth } from '../../context/AuthContext';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const PartnerDashboardOverview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeDeliveries: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/partners/orders');
                const orders = response.data;

                const totalOrders = orders.length;
                const activeDeliveries = orders.filter((o: any) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
                const totalRevenue = orders
                    .filter((o: any) => o.status === 'COMPLETED')
                    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);

                setStats({ totalOrders, activeDeliveries, totalRevenue });
            } catch (error) {
                console.error("Failed to fetch partner stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // In the future this can check user.partnerProfile.partnerType to show specific widgets

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
                <p className="text-gray-500">Here's your partner performance overview.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                        <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.totalOrders}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Package size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Active Deliveries</p>
                        <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : stats.activeDeliveries}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900">{loading ? '-' : `₦${stats.totalRevenue.toLocaleString()}`}</h3>
                    </div>
                    <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-gray-500">
                    No recent activity to display.
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboardOverview;
