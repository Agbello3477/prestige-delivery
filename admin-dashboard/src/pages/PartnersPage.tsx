import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2 } from 'lucide-react';

interface Partner {
    id: number;
    name: string;
    email: string;
    phone: string;
    isVerified: boolean;
    createdAt: string;
    partnerProfile?: {
        partnerType: 'FOOD' | 'ECOMMERCE' | 'PHARMACY' | 'AUTOMOBILE';
        businessName: string;
        address: string | null;
        agreedPercentage: number | null;
    };
}

const PartnersPage = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newPartner, setNewPartner] = useState({
        name: '', email: '', password: '', phone: '',
        partnerType: 'FOOD' as 'FOOD' | 'ECOMMERCE' | 'PHARMACY' | 'AUTOMOBILE',
        businessName: '', address: '', agreedPercentage: 0
    });

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const response = await api.get('/partners');
            setPartners(response.data);
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newPartner,
                agreedPercentage: newPartner.partnerType === 'AUTOMOBILE' ? Number(newPartner.agreedPercentage) : undefined
            };
            await api.post('/partners', payload);
            setShowModal(false);
            setNewPartner({ name: '', email: '', password: '', phone: '', partnerType: 'FOOD', businessName: '', address: '', agreedPercentage: 0 });
            fetchPartners();
            alert('Partner created successfully!');
        } catch (error) {
            console.error('Error creating partner:', error);
            alert('Failed to create partner');
        }
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Partners</h1>
                    <p className="text-gray-500">Manage logistics partners</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Partner
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search partners..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vendor Info</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                        ) : filteredPartners.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No partners found.</td></tr>
                        ) : (
                            filteredPartners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                                                {partner.partnerProfile?.businessName?.charAt(0) || partner.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block">{partner.name}</span>
                                                <span className="text-xs text-gray-500">{partner.partnerProfile?.partnerType || 'General'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-900 font-medium">
                                            {partner.partnerProfile?.businessName || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="text-gray-900">{partner.email}</p>
                                            <p className="text-gray-500">{partner.phone || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${partner.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {partner.isVerified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(partner.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-red-500 hover:text-red-700 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Partner Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Partner</h2>
                        <form onSubmit={handleCreatePartner} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type</label>
                                <select
                                    value={newPartner.partnerType}
                                    onChange={(e) => setNewPartner({ ...newPartner, partnerType: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                >
                                    <option value="FOOD">Food / Snacks</option>
                                    <option value="PHARMACY">Pharmacy</option>
                                    <option value="ECOMMERCE">E-Commerce</option>
                                    <option value="AUTOMOBILE">Automobile (Bike Provider)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newPartner.businessName}
                                    onChange={(e) => setNewPartner({ ...newPartner, businessName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                    placeholder="e.g. Prestige Burgers"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                                <input
                                    type="text"
                                    value={newPartner.address}
                                    onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>

                            {newPartner.partnerType === 'AUTOMOBILE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Percentage Cut (%)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        value={newPartner.agreedPercentage}
                                        onChange={(e) => setNewPartner({ ...newPartner, agreedPercentage: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">The % cut of each delivery given to this vendor for supplying the bikes.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Owner / Representative Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newPartner.name}
                                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID)</label>
                                <input
                                    type="email"
                                    required
                                    value={newPartner.email}
                                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={newPartner.phone}
                                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPartner.password}
                                    onChange={(e) => setNewPartner({ ...newPartner, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
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
                                    Create Partner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnersPage;
