import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await loginUser(email, password);
            if (user.role === 'PARTNER') {
                navigate('/partner-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || err.message || 'Invalid email or password');
            } else {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 shadow-brand-500/10">
                <div className="mb-8">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h3>
                    <p className="text-gray-500 font-medium mt-1">Access your platform dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            25% { transform: translateX(-4px); }
                            75% { transform: translateX(4px); }
                        }
                        .animate-shake {
                            animation: shake 0.2s ease-in-out 0s 2;
                        }
                    `}</style>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1" htmlFor="email">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                id="email"
                                required
                                placeholder="name@company.com"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white focus:border-brand-500 transition-all font-medium text-gray-900"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest" htmlFor="password">Secret Password</label>
                            <Link to="/forgot-password" title="Reset Password" aria-label="Forgot Password" className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                id="password"
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white focus:border-brand-500 transition-all font-medium text-gray-900"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Sign Into Dashboard
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    <div className="pt-4 text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Need an account? <Link to="/register" className="text-brand-600 hover:text-brand-700 underline decoration-2 underline-offset-4 font-black">Contact Admin</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
