import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailParam = params.get('email');
        if (emailParam) setEmail(emailParam);
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/reset-password', { email, token, newPassword });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 uppercase tracking-tight font-medium">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                    <div className="flex justify-center mb-6">
                        <Logo />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">New Password</h2>
                    <p className="text-gray-500 text-center text-sm mb-8">Enter the 6-digit code and your new password.</p>

                    {message && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                                placeholder="admin@prestige.com"
                                disabled={loading || !!message}
                            />
                        </div>

                        <div>
                            <label htmlFor="token" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Verification Code</label>
                            <input
                                id="token"
                                type="text"
                                required
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none text-center text-xl tracking-widest font-bold"
                                placeholder="123456"
                                disabled={loading || !!message}
                            />
                        </div>

                        <div>
                            <label htmlFor="pass" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">New Password</label>
                            <input
                                id="pass"
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                                placeholder="••••••••"
                                disabled={loading || !!message}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirm" className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Confirm Password</label>
                            <input
                                id="confirm"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
                                placeholder="••••••••"
                                disabled={loading || !!message}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <div className="text-center pt-2">
                            <Link to="/login" className="text-sm text-gray-500 hover:text-brand-600 transition">Back to Login</Link>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResetPassword;
