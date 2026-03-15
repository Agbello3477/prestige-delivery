import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const SettingsPage = () => {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await api.patch('/auth/change-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setSuccess('Password updated successfully!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6 uppercase tracking-tight font-medium">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="md:col-span-1">
                    <h2 className="text-lg font-bold text-gray-800">Profile Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your administrator profile and contact information.</p>
                </div>
                
                <div className="md:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{user?.name}</h3>
                                <p className="text-sm text-gray-500">{user?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Account Role</label>
                                <p className="text-sm font-bold text-brand-600 bg-brand-50 inline-block px-3 py-1 rounded-full">{user?.role}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Phone Number</label>
                                <p className="text-sm font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 my-4 md:col-span-3"></div>

                {/* Password Section */}
                <div className="md:col-span-1">
                    <h2 className="text-lg font-bold text-gray-800">Security</h2>
                    <p className="text-sm text-gray-500 mt-1">Change your password to keep your account secure.</p>
                </div>

                <div className="md:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
                    <form onSubmit={handleChangePassword} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl text-sm border border-green-100 animate-in fade-in slide-in-from-top-1">
                                <CheckCircle2 size={18} />
                                <span>{success}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Current Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={passwords.oldPassword}
                                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        placeholder="Verify new password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
