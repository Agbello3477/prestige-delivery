import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit2, X, Loader2 } from 'lucide-react';

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
        isActive: boolean;
    };
}

const PartnersPage = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editingPartnerId, setEditingPartnerId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '',
        partnerType: 'FOOD' as 'FOOD' | 'ECOMMERCE' | 'PHARMACY' | 'AUTOMOBILE',
        businessName: '', address: '', agreedPercentage: 0,
        isActive: true
    });

    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

    useEffect(() => {
        fetchPartners();
    }, [activeTab]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'ARCHIVED' ? '/partners/archived' : '/partners';
            const response = await api.get(endpoint);
            setPartners(response.data);
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (partner?: Partner) => {
        if (partner) {
            setIsEdit(true);
            setEditingPartnerId(partner.id);
            setFormData({
                name: partner.name,
                email: partner.email,
                password: '', // Don't show password
                phone: partner.phone || '',
                partnerType: partner.partnerProfile?.partnerType || 'FOOD',
                businessName: partner.partnerProfile?.businessName || '',
                address: partner.partnerProfile?.address || '',
                agreedPercentage: partner.partnerProfile?.agreedPercentage || 0,
                isActive: partner.partnerProfile?.isActive ?? true
            });
        } else {
            setIsEdit(false);
            setEditingPartnerId(null);
            setFormData({
                name: '', email: '', password: '', phone: '',
                partnerType: 'FOOD',
                businessName: '', address: '', agreedPercentage: 0,
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure agreedPercentage is a valid number, default to 0 if NaN
            const percentage = parseFloat(String(formData.agreedPercentage));
            const safePercentage = isNaN(percentage) ? 0 : percentage;

            const payload = {
                ...formData,
                agreedPercentage: formData.partnerType === 'AUTOMOBILE' ? safePercentage : 0
            };

            if (isEdit && editingPartnerId) {
                await api.put(`/partners/${editingPartnerId}`, payload);
                alert('Partner updated successfully!');
            } else {
                await api.post('/partners', payload);
                alert('Partner created successfully!');
            }
            setShowModal(false);
            fetchPartners();
        } catch (error) {
            console.error('Error saving partner:', error);
            const axiosError = error as { response?: { data?: { message?: string, error?: string, errors?: Array<{path: string[], message: string}> } } };
            
            let serverMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Validation failed. Please check all fields.';
            
            if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
                const details = axiosError.response.data.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                serverMessage = `${serverMessage} (${details})`;
            }

            alert(`Failed to save partner: ${serverMessage}`);
        }
    };

    const handleArchive = async (id: number, name: string) => {
        if (window.confirm(`Are you sure you want to archive partner "${name}"? Financial records will be kept.`)) {
            try {
                await api.delete(`/partners/${id}`);
                setPartners(partners.filter(p => p.id !== id));
                alert('Partner archived successfully');
            } catch (error) {
                console.error('Error archiving partner:', error);
                const axiosError = error as { response?: { data?: { message?: string } } };
                const msg = axiosError.response?.data?.message || 'Failed to archive partner';
                alert(`Error: ${msg}`);
            }
        }
    };

    const handleRestore = async (id: number, name: string) => {
        if (window.confirm(`Are you sure you want to restore partner "${name}"?`)) {
            try {
                await api.post(`/partners/${id}/restore`);
                setPartners(partners.filter(p => p.id !== id));
                alert('Partner restored successfully');
            } catch (error) {
                console.error('Error restoring partner:', error);
                const axiosError = error as { response?: { data?: { message?: string } } };
                const msg = axiosError.response?.data?.message || 'Failed to restore partner';
                alert(`Error: ${msg}`);
            }
        }
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.partnerProfile?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Partner Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View, track, and manage your delivery partners.</p>
                </div>
                {activeTab === 'ACTIVE' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700 transition-all font-medium shadow-sm active:scale-95"
                    >
                        <Plus size={18} />
                        Add Partner
                    </button>
                )}
            </div>

            {/* Tabs & Search Container */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('ACTIVE')}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'ACTIVE' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active Partners
                    </button>
                    <button
                        onClick={() => setActiveTab('ARCHIVED')}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'ARCHIVED' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Archived / Deactivated
                    </button>
                </div>
                
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search partners..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-shadow bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business / Owner</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                                            <span className="text-sm font-medium">Fetching partners...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPartners.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg font-semibold text-gray-400 italic">No partners found.</span>
                                            <span className="text-sm">Try adjusting your search filters.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPartners.map((partner) => (
                                    <tr key={partner.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg shadow-inner">
                                                    {partner.partnerProfile?.businessName?.charAt(0) || partner.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-900 block leading-tight">
                                                        {partner.partnerProfile?.businessName || 'Unnamed Business'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 mt-1 font-medium">{partner.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 text-[11px] font-bold bg-gray-100 text-gray-600 rounded-md uppercase tracking-wider">
                                                {partner.partnerProfile?.partnerType || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-900 font-medium">{partner.email}</p>
                                                <p className="text-gray-500 mt-0.5">{partner.phone || 'No phone'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${partner.partnerProfile?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className={`text-xs font-bold uppercase tracking-tight ${partner.partnerProfile?.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                                    {partner.partnerProfile?.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'ACTIVE' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleOpenModal(partner)}
                                                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                        title="Edit Partner"
                                                        aria-label={`Edit ${partner.name}`}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleArchive(partner.id, partner.partnerProfile?.businessName || partner.name)}
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors ml-2"
                                                        title="Archive Partner"
                                                        aria-label={`Archive ${partner.name}`}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => handleRestore(partner.id, partner.partnerProfile?.businessName || partner.name)}
                                                    className="px-3 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
                                                    title="Restore Partner"
                                                    aria-label={`Restore ${partner.name}`}
                                                >
                                                    Restore Account
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Unified Modal (Add/Edit) */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEdit ? 'Update Partner Details' : 'Onboard New Partner'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Close Modal"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-1">Business Identity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="partnerType" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Business Type</label>
                                            <select
                                                id="partnerType"
                                                title="Business Type"
                                                value={formData.partnerType}
                                                onChange={(e) => setFormData({ ...formData, partnerType: e.target.value as typeof formData.partnerType })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                            >
                                                <option value="FOOD">Food / Snacks</option>
                                                <option value="PHARMACY">Pharmacy</option>
                                                <option value="ECOMMERCE">E-Commerce</option>
                                                <option value="AUTOMOBILE">Automobile (Bike Provider)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="businessName" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Business Name</label>
                                            <input
                                                id="businessName"
                                                type="text"
                                                required
                                                value={formData.businessName}
                                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                                placeholder="e.g. Prestige Express"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="address" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Physical Address</label>
                                        <input
                                            id="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                            placeholder="Street, City, Kano"
                                        />
                                    </div>

                                    {formData.partnerType === 'AUTOMOBILE' && (
                                        <div className="bg-brand-50 p-3 rounded-xl border border-brand-100">
                                            <label htmlFor="agreedPercentage" className="block text-xs font-bold text-brand-700 mb-1.5 uppercase">Agreed Commission (%)</label>
                                            <input
                                                id="agreedPercentage"
                                                type="number"
                                                required
                                                min="0"
                                                max="100"
                                                value={isNaN(formData.agreedPercentage as number) ? '' : formData.agreedPercentage}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                    setFormData({ ...formData, agreedPercentage: val });
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-3 border"
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest border-b pb-1">Owner / Auth Account</h3>
                                    <div>
                                        <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Owner Name</label>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Email Address</label>
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Phone Number</label>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    {!isEdit && (
                                        <div>
                                            <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Password</label>
                                            <input
                                                id="password"
                                                type="password"
                                                required={!isEdit}
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-sm font-medium"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    )}

                                    {isEdit && (
                                        <div className="flex items-center gap-3 py-2">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                            />
                                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Account Active</label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 font-bold transition-colors border border-gray-200"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 text-white bg-brand-600 rounded-xl hover:bg-brand-700 font-bold transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                                >
                                    {isEdit ? 'Save Changes' : 'Confirm Registration'}
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
