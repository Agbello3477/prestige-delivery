import type { LucideIcon } from 'lucide-react';
import { Users, Package, Truck, Activity, Loader2 } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import IntelligentMap from '../components/IntelligentMap';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/stats.service';

interface Stat {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend: string;
    color: string;
}

const DashboardOverview = () => {
    const [stats, setStats] = useState<Stat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                // Map icons back to the stats from the API
                const iconMap: Record<string, LucideIcon> = {
                    'Total Deliveries': Package,
                    'Active Riders': Truck,
                    'New Customers': Users,
                    'Revenue': Activity
                };

                const formattedStats = data.stats.map((stat: { title: string; [key: string]: unknown }) => ({
                    ...stat,
                    icon: iconMap[stat.title] || Activity
                }));

                setStats(formattedStats);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.length > 0 ? (
                    stats.map((stat, index) => (
                        <StatsCard key={index} {...stat} />
                    ))
                ) : (
                    <div className="col-span-4 text-center py-10 text-gray-400">
                        No statistical data available yet.
                    </div>
                )}
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
