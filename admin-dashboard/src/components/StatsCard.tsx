import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string;
}

const StatsCard = ({ title, value, icon: Icon, trend, color = 'bg-blue-500' }: StatsCardProps) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {trend && (
                <div className="mt-4">
                    <span className="text-sm font-medium text-green-600">{trend}</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
            )}
        </div>
    );
};

export default StatsCard;
