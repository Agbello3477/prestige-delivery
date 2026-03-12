import { Users, Package, Truck, Activity } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import IntelligentMap from '../components/IntelligentMap';

const DashboardOverview = () => {
    // Mock data for now - will be replaced with API calls
    const stats = [
        { title: 'Total Deliveries', value: '1,234', icon: Package, trend: '+12%', color: 'bg-blue-500' },
        { title: 'Active Riders', value: '45', icon: Truck, trend: '+5%', color: 'bg-green-500' },
        { title: 'New Customers', value: '128', icon: Users, trend: '+8%', color: 'bg-indigo-500' },
        { title: 'Revenue', value: '₦ 4.5M', icon: Activity, trend: '+15%', color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-semibold mb-4">Intelligent Map</h3>
                    <div className="h-[300px] w-full bg-gray-50 rounded-lg overflow-hidden relative z-0">
                        <IntelligentMap />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="flex items-center justify-center h-full text-gray-400">
                        Activity List Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
