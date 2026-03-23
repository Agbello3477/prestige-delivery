import { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../services/api';
import { Package, Clock, CheckCircle, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface VendorOrder {
    id: number;
    customerId: number;
    status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
    totalAmount: string;
    items: OrderItem[];
    createdAt: string;
}

const PartnerOrdersPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [newOrderAlert, setNewOrderAlert] = useState(false);

    useEffect(() => {
        fetchOrders();

        // Socket.io initialization
        const socket = io(BASE_URL);

        if (user) {
            socket.emit('join', user.id.toString());
        }

        socket.on('new_order', (newOrder: VendorOrder) => {
            console.log('New order received via socket:', newOrder);
            setOrders(prev => [newOrder, ...prev]);
            setNewOrderAlert(true);
            // Play a sound if possible, or just show the alert
            setTimeout(() => setNewOrderAlert(false), 8000);
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/partners/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching vendor orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            await api.patch(`/partners/orders/${orderId}/status`, { status });
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
            case 'PREPARING': return 'bg-purple-100 text-purple-800';
            case 'READY_FOR_PICKUP': return 'bg-orange-100 text-orange-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Incoming Orders</h1>
                <p className="text-gray-500">Manage orders placed directly from the customer app.</p>
            </div>

            {newOrderAlert && (
                <div className="bg-brand-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
                    <div className="flex items-center gap-3">
                        <Bell className="animate-pulse" />
                        <div>
                            <p className="font-bold">New Order Received!</p>
                            <p className="text-sm opacity-90">A new customer order has just arrived.</p>
                        </div>
                    </div>
                    <button onClick={() => setNewOrderAlert(false)} className="text-white/80 hover:text-white">✕</button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Orders Yet</h3>
                    <p className="text-gray-500">You do not have any incoming vendor orders.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                    <Clock size={16} />
                                    {new Date(order.createdAt).toLocaleString()}
                                </div>

                                {/* Order Items Display */}
                                <div className="space-y-2 mb-4">
                                    {order.items && order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">{item.quantity}x {item.name}</span>
                                            <span className="text-gray-900">₦{item.price}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>₦{order.totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                                {order.status === 'PENDING' && (
                                    <>
                                        <button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')} className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition">
                                            Accept Order
                                        </button>
                                        <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition">
                                            Decline
                                        </button>
                                    </>
                                )}
                                {order.status === 'ACCEPTED' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition">
                                        Mark as Preparing
                                    </button>
                                )}
                                {order.status === 'PREPARING' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')} className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition">
                                        Ready for Pickup
                                    </button>
                                )}
                                {order.status === 'READY_FOR_PICKUP' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'COMPLETED')} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                                        <CheckCircle size={18} /> Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PartnerOrdersPage;
