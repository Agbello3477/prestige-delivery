import { useEffect, useState } from 'react';
import { getCustomers, suspendCustomer, blockCustomer, liftCustomerSuspension } from '../services/customer.service';
import type { Customer } from '../services/customer.service';
import { getDeliveries, cancelDelivery } from '../services/delivery.service';
import type { Delivery } from '../services/delivery.service';
import { Search, X, Ban, Clock, Play, Package, User, Phone, Mail, Calendar, AlertTriangle } from 'lucide-react';

const CustomersPage = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Deliveries for the selected customer
    const [customerDeliveries, setCustomerDeliveries] = useState<Delivery[]>([]);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);

    // Suspension state
    const [showSuspendInput, setShowSuspendInput] = useState(false);
    const [suspendDuration, setSuspendDuration] = useState('1');
    const [suspendUnit, setSuspendUnit] = useState<'days' | 'weeks' | 'months'>('weeks');

    // Cancellation state
    const [cancellationReason, setCancellationReason] = useState('');
    const [cancellingDeliveryId, setCancellingDeliveryId] = useState<string | null>(null);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowSuspendInput(false);
        setLoadingDeliveries(true);
        try {
            const allDeliveries = await getDeliveries();
            // Filter locally for now
            const filtered = allDeliveries.filter(d => 
                // We need to match by identifying the customer in the delivery object
                // Delivery object has customer: { name, phone } 
                // In a real app we'd have customerId in delivery.
                // Looking at deliveryController, it has customerId.
                // Let's assume the frontend Delivery interface has customerId or we match by phone if needed.
                // Assuming backend returns customerId in delivery as well.
                (d as unknown as { customerId: number }).customerId === customer.id
            );
            setCustomerDeliveries(filtered);
        } catch (error) {
            console.error('Failed to load customer deliveries', error);
        } finally {
            setLoadingDeliveries(false);
        }
    };

    const handleSuspend = async (id: number) => {
        try {
            const data = await suspendCustomer(id, parseInt(suspendDuration), suspendUnit);
            setCustomers(customers.map(c => c.id === id ? { ...c, isSuspended: true, suspensionEndDate: data.suspensionEndDate } : c));
            setSelectedCustomer({ ...selectedCustomer!, isSuspended: true, suspensionEndDate: data.suspensionEndDate });
            setShowSuspendInput(false);
            alert("Customer suspended successfully.");
        } catch {
            alert("Failed to suspend customer.");
        }
    };

    const handleBlock = async (id: number) => {
        if (!window.confirm("Are you sure you want to permanently block this customer?")) return;
        try {
            await blockCustomer(id);
            setCustomers(customers.map(c => c.id === id ? { ...c, isBlocked: true } : c));
            setSelectedCustomer({ ...selectedCustomer!, isBlocked: true });
            alert("Customer blocked successfully.");
        } catch {
            alert("Failed to block customer.");
        }
    };

    const handleLiftSuspension = async (id: number) => {
        try {
            await liftCustomerSuspension(id);
            setCustomers(customers.map(c => c.id === id ? { ...c, isSuspended: false, isBlocked: false, suspensionEndDate: undefined } : c));
            setSelectedCustomer({ ...selectedCustomer!, isSuspended: false, isBlocked: false, suspensionEndDate: undefined });
            alert("Suspension/Block lifted successfully.");
        } catch {
            alert("Failed to lift suspension.");
        }
    };

    const handleCancelRequest = async (deliveryId: string) => {
        if (!cancellationReason.trim()) {
            alert("Please provide a reason for cancellation.");
            return;
        }
        try {
            await cancelDelivery(deliveryId, cancellationReason);
            setCustomerDeliveries(customerDeliveries.map(d => d.id === deliveryId ? { ...d, status: 'CANCELLED' } : d));
            setCancellingDeliveryId(null);
            setCancellationReason('');
            alert("Delivery cancelled successfully.");
        } catch {
            alert("Failed to cancel delivery.");
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading customers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Deliveries</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                            <div className="text-xs text-gray-500">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>{customer.phone}</div>
                                    <div className="text-xs">{customer.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer._count?.deliveriesAsCustomer || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {customer.isBlocked ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-800 text-white">Blocked</span>
                                    ) : customer.isSuspended ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">Suspended</span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleViewDetails(customer)}
                                        className="text-brand-600 hover:text-brand-900 font-semibold"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">No customers found.</div>
                )}
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">Customer Management: {selectedCustomer.name}</h3>
                            <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-gray-100 rounded-full" title="Close">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Left Column: Info & Actions */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <h4 className="font-bold text-gray-900 border-b pb-2">Profile Information</h4>
                                    <div className="flex items-center text-sm">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-gray-900">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-gray-900">{selectedCustomer.phone}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-gray-900 break-all">{selectedCustomer.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="text-gray-900">Joined {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900">Disciplinary Actions</h4>
                                    
                                    {selectedCustomer.isBlocked || selectedCustomer.isSuspended ? (
                                        <button
                                            onClick={() => handleLiftSuspension(selectedCustomer.id)}
                                            className="w-full flex justify-center items-center py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold"
                                        >
                                            <Play className="w-4 h-4 mr-2" /> Lift Suspension
                                        </button>
                                    ) : (
                                        <div className="space-y-2">
                                            {showSuspendInput ? (
                                                <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg space-y-2">
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="number"
                                                            title="Duration"
                                                            min="1"
                                                            value={suspendDuration}
                                                            onChange={e => setSuspendDuration(e.target.value)}
                                                            className="w-16 p-1 text-xs border rounded"
                                                        />
                                                        <select
                                                            title="Unit"
                                                            value={suspendUnit}
                                                            onChange={e => setSuspendUnit(e.target.value as 'days' | 'weeks' | 'months')}
                                                            className="flex-1 p-1 text-xs border rounded"
                                                        >
                                                            <option value="days">Days</option>
                                                            <option value="weeks">Weeks</option>
                                                            <option value="months">Months</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex justify-end space-x-2">
                                                        <button onClick={() => setShowSuspendInput(false)} className="text-xs text-gray-500 underline">Cancel</button>
                                                        <button 
                                                            onClick={() => handleSuspend(selectedCustomer.id)}
                                                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold"
                                                        >
                                                            Suspend
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowSuspendInput(true)}
                                                    className="w-full flex justify-center items-center py-2 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg hover:bg-orange-100 text-sm font-medium"
                                                >
                                                    <Clock className="w-4 h-4 mr-2" /> Suspend
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleBlock(selectedCustomer.id)}
                                                className="w-full flex justify-center items-center py-2 bg-red-50 text-red-700 border border-red-100 rounded-lg hover:bg-red-100 text-sm font-medium"
                                            >
                                                <Ban className="w-4 h-4 mr-2" /> Block
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Delivery History */}
                            <div className="md:col-span-2 space-y-4">
                                <h4 className="font-bold text-gray-900 flex items-center">
                                    <Package className="w-5 h-5 mr-2 text-brand-600" />
                                    Delivery History
                                </h4>

                                {loadingDeliveries ? (
                                    <div className="py-10 text-center text-gray-500 italic">Fetching delivery history...</div>
                                ) : customerDeliveries.length > 0 ? (
                                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                        {customerDeliveries.map(delivery => (
                                            <div key={delivery.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-mono text-gray-400">#{delivery.id.substring(0, 8)}</span>
                                                        <h5 className="text-sm font-bold text-gray-900">{delivery.pickupAddress} → {delivery.dropoffAddress}</h5>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                        delivery.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                        'bg-brand-100 text-brand-700'
                                                    }`}>
                                                        {delivery.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="text-[11px] text-gray-500">
                                                        {new Date(delivery.createdAt).toLocaleString()} • {delivery.paymentMethod}
                                                        {delivery.rider && ` • Rider: ${delivery.rider.name}`}
                                                    </div>
                                                    {delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED' && (
                                                        <div className="flex flex-col items-end">
                                                            {cancellingDeliveryId === delivery.id ? (
                                                                <div className="mt-2 space-y-2 w-full">
                                                                    <textarea
                                                                        className="w-full p-2 text-xs border rounded-lg"
                                                                        placeholder="Reason for cancellation..."
                                                                        value={cancellationReason}
                                                                        onChange={(e) => setCancellationReason(e.target.value)}
                                                                        rows={2}
                                                                    />
                                                                    <div className="flex justify-end space-x-2">
                                                                        <button onClick={() => setCancellingDeliveryId(null)} className="text-xs text-gray-400">Back</button>
                                                                        <button 
                                                                            onClick={() => handleCancelRequest(delivery.id)}
                                                                            className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold"
                                                                        >
                                                                            Confirm Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setCancellingDeliveryId(delivery.id)}
                                                                    className="text-xs text-red-600 font-bold hover:underline flex items-center"
                                                                >
                                                                    <AlertTriangle className="w-3 h-3 mr-1" /> Flag/Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center text-gray-400 italic">No delivery history found for this customer.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersPage;
