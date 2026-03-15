import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Clock, User, AlertCircle, Loader2 } from 'lucide-react';

interface AuditLog {
    id: number;
    action: string;
    details: string | null;
    ipAddress: string | null;
    timestamp: string;
    user?: {
        name: string;
        email: string;
        role: string;
    };
}

const ActivityLogPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/audit');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATED')) return 'text-green-600 bg-green-50 border-green-100';
        if (action.includes('UPDATED')) return 'text-blue-600 bg-blue-50 border-blue-100';
        if (action.includes('DELETED')) return 'text-red-600 bg-red-50 border-red-100';
        if (action === 'LOGIN') return 'text-purple-600 bg-purple-50 border-purple-100';
        if (action === 'LOGOUT') return 'text-gray-600 bg-gray-50 border-gray-100';
        return 'text-gray-600 bg-gray-50 border-gray-100';
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const parseDetails = (details: string | null) => {
        if (!details) return null;
        try {
            const obj = JSON.parse(details);
            return (
                <pre className="text-[10px] mt-1 bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto whitespace-pre-wrap max-w-xs">
                    {JSON.stringify(obj, null, 2)}
                </pre>
            );
        } catch {
            return <span className="text-xs text-gray-500 italic">{details}</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Activity Logs</h1>
                    <p className="text-gray-500 text-sm mt-1">Audit trail for user actions and system events.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm"
                    title="Refresh logs"
                >
                    <Clock size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search logs by action, user, or details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                />
            </div>

            {/* Logs Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Context / Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="animate-spin text-brand-500" size={32} />
                                            <span>Loading activity logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-gray-900">
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900">{log.user?.name || 'System / Guest'}</div>
                                                    <div className="text-[10px] text-gray-500">{log.user?.email || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-tighter ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            {parseDetails(log.details)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                            {log.ipAddress || 'unknown'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500 px-2 font-medium">
                <span>Showing {filteredLogs.length} recent activities</span>
                <span className="flex items-center gap-1">
                    <AlertCircle size={14} />
                    Logs are retained for 30 days
                </span>
            </div>
        </div>
    );
};

export default ActivityLogPage;
