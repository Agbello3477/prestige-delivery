import { useEffect, useState } from 'react';
import { getDeliveries } from '../services/delivery.service';
import { BASE_URL } from '../services/api';
import type { Delivery } from '../services/delivery.service';
import { Search, MapPin, Calendar, User, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const DeliveriesPage = () => {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPOD, setSelectedPOD] = useState<{ url: string; type: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        try {
            const data = await getDeliveries();
            setDeliveries(data);
        } catch (error) {
            console.error('Failed to load deliveries', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search deliveries..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer / Rider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {deliveries.map((delivery) => (
                            <tr key={delivery.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-600 font-bold">
                                    {delivery.trackingNumber || `#${delivery.id.substring(0, 8)}`}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col space-y-1">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <MapPin className="w-4 h-4 mr-1 text-green-500" /> {delivery.pickupAddress}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-900">
                                            <MapPin className="w-4 h-4 mr-1 text-red-500" /> {delivery.dropoffAddress}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 flex items-center"><User className="w-4 h-4 mr-1 text-gray-400" /> {delivery.customer.name}</div>
                                    {delivery.rider && (
                                        <button
                                            onClick={() => navigate(`/dashboard/riders?id=${(delivery.rider as any).id}`)}
                                            className="text-sm text-brand-600 flex items-center mt-1 hover:text-brand-800 hover:underline transition-all text-left"
                                        >
                                            <User className="w-4 h-4 mr-1" /> {delivery.rider.name}
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {format(new Date(delivery.createdAt), 'MMM d, HH:mm')}</div>
                                    <div className="mt-1">₦ {Number(delivery.price || 0).toLocaleString()} ({delivery.distanceKm || 0} km)</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-orange-100 text-orange-800">
                                        {delivery.paymentMethod === 'TRANSFER' ? '🏦 Transfer' : delivery.paymentMethod === 'POS' ? '💳 POS' : '💵 Cash'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col items-start space-y-2">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                                            {delivery.status}
                                        </span>
                                        {delivery.status === 'DELIVERED' && delivery.proofUrl && (
                                            <button
                                                onClick={() => setSelectedPOD({ url: delivery.proofUrl!, type: delivery.proofType || 'SIGNATURE' })}
                                                className="text-xs font-semibold px-2 py-1 rounded bg-brand-100 text-brand-700 hover:bg-brand-200 transition flex items-center"
                                            >
                                                <FileText className="w-3 h-3 mr-1" /> View POD
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* POD Modal */}
            {selectedPOD && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-900">Proof of Delivery ({selectedPOD.type})</h3>
                            <button onClick={() => setSelectedPOD(null)} title="Close Modal" className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-center items-center min-h-[300px]">
                            {selectedPOD.type === 'VIDEO' ? (
                                <video
                                    src={`${BASE_URL}/${selectedPOD.url.replace(/\\/g, '/')}`}
                                    controls
                                    className="max-w-full max-h-[60vh] rounded"
                                />
                            ) : (
                                <img
                                    src={selectedPOD.url.startsWith('data:') ? selectedPOD.url : `${BASE_URL}/${selectedPOD.url.replace(/\\/g, '/')}`}
                                    alt="Proof of Delivery"
                                    className="max-w-full max-h-[60vh] rounded shadow-sm"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveriesPage;
