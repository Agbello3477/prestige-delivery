import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: string;
    imageUrl: string | null;
    isAvailable: boolean;
}

const PartnerMenuPage = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        imageUrl: ''
    });


    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('/partners/my-menu');
            setMenuItems(response.data);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/partners/menu', {
                ...newItem,
                price: parseFloat(newItem.price)
            });
            setShowModal(false);
            setNewItem({ name: '', description: '', price: '', imageUrl: '' });
            fetchMenuItems();
            alert('Item added successfully!');
        } catch (error) {
            console.error('Failed to create item', error);
            alert('Failed to add item');
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            await api.delete(`/partners/menu/${id}`);
            fetchMenuItems();
        } catch (error) {
            console.error('Failed to delete item', error);
            // Ignore error for now if endpoint is missing, alert user
            alert('Feature under construction or endpoint missing.');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Menu / Items</h1>
                    <p className="text-gray-500">Manage your catalog offerings here.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition"
                >
                    <Plus size={20} />
                    Add New Item
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading catalog...</div>
            ) : menuItems.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <ImageIcon size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Items Yet</h3>
                    <p className="text-gray-500 mb-4">You haven't added any products or food items to your catalog.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-brand-600 font-medium hover:text-brand-700"
                    >
                        Click here to add your first item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-48 bg-gray-100 relative">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <ImageIcon size={48} opacity={0.5} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:text-brand-600">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                                    <span className="font-bold text-brand-600">₦{item.price}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                    {item.description || "No description provided."}
                                </p>
                                <div className="flex items-center gap-2 mt-auto">
                                    <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-medium text-gray-600">
                                        {item.isAvailable ? 'In Stock / Available' : 'Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Menu / Catalog Item</h2>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500"
                                    placeholder="e.g. Double Cheeseburger"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500"
                                    rows={3}
                                    placeholder="Brief details about this item..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500"
                                    placeholder="2500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    value={newItem.imageUrl}
                                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerMenuPage;
