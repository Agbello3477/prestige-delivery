import { useEffect, useState } from 'react';
import { getReconciliationReport } from '../services/rider.service';
import { Search, Info } from 'lucide-react';

interface ReconciliationReport {
    id: number;
    name: string;
    phone: string;
    totalDeliveries: number;
    financials: {
        totalRevenue: number;
        totalCOD: number;
        totalTransfer: number;
        totalPOS: number;
        riderCommission: number;
        companyRevenue: number;
        codRemittance: number;
    };
}

const ReconciliationPage = () => {
    const [reports, setReports] = useState<ReconciliationReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const data = await getReconciliationReport();
                setReports(data);
            } catch (error) {
                console.error('Failed to load reconciliation reports', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const filteredReports = reports.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.includes(searchTerm)
    );

    // Aggregate Totals
    const totalPendingRemittance = filteredReports.reduce((acc, curr) => acc + curr.financials.codRemittance, 0);
    const totalCompanyRevenue = filteredReports.reduce((acc, curr) => acc + curr.financials.companyRevenue, 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">COD Reconciliation</h1>
                    <p className="text-gray-500 text-sm mt-1">Track driver balance, commissions, and required remittances.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search riders by name/phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full md:w-64 bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Global Aggregation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-red-800 font-bold mb-1 uppercase text-xs tracking-wider">Total Projected Remittance</p>
                            <h2 className="text-3xl font-black text-red-600">
                                {totalPendingRemittance > 0 ? `₦${totalPendingRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₦0.00'}
                            </h2>
                            <p className="text-red-700 text-sm mt-2">Sum of cash currently held by riders owed to Prestige.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-800 font-bold mb-1 uppercase text-xs tracking-wider">Total Company Revenue</p>
                            <h2 className="text-3xl font-black text-green-700">
                                ₦{totalCompanyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <p className="text-green-700 text-sm mt-2">Total 30% cumulative cut generated across all visible trips.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert/Info Banner */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong className="block mb-1 font-bold">How is Remittance calculated?</strong>
                    The <strong>Pending Remittance</strong> column represents: <code className="bg-blue-100 px-1 rounded">Total COD Cash Collected - Rider's 70% Global Commission</code>.
                    If positive (<span className="text-red-600 font-bold px-1 rounded border border-red-200 bg-red-50">Red</span>), the Rider collected more cash than their 70% overall cut natively covers, meaning they owe Prestige the difference.
                    If negative (<span className="text-green-600 font-bold px-1 rounded border border-green-200 bg-green-50">Green</span>), Prestige collected more digital (Transfer/POS) revenue representing the Rider's 70% cut than the cash they hold, meaning Prestige owes the Rider.
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rider</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Deliveries</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total COD</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Rider Commission (70%)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Remittance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Loading reconciliation data...
                                    </td>
                                </tr>
                            ) : filteredReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No verified riders or records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">{report.name}</div>
                                            <div className="text-sm text-gray-500">{report.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                {report.totalDeliveries} trips
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-700">
                                            ₦{report.financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-amber-700">
                                            ₦{report.financials.totalCOD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-brand-700">
                                            ₦{report.financials.riderCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className={`px-3 py-1.5 rounded-lg font-black ${report.financials.codRemittance > 0
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : report.financials.codRemittance < 0
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                                                }`}>
                                                {report.financials.codRemittance > 0
                                                    ? `₦${report.financials.codRemittance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Owes)`
                                                    : report.financials.codRemittance < 0
                                                        ? `₦${Math.abs(report.financials.codRemittance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Owed)`
                                                        : 'Settled'
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationPage;
