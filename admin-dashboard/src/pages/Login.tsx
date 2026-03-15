import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import type { FormEvent } from 'react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const user = await loginUser(email, password);
            if (user.role === 'PARTNER') {
                navigate('/partner-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const error = err as any;
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Invalid email or password');
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <div className="flex-1 flex items-center justify-center">
                <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-sm">
                    <div className="flex justify-center mb-4">
                        <Logo />
                    </div>
                    <h3 className="text-2xl font-bold text-center text-brand-900">Sign In</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="mt-4">
                            <div>
                                <label className="block" htmlFor="email">Email</label>
                                <input
                                    type="text"
                                    id="email"
                                    placeholder="Email"
                                    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="mt-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block" htmlFor="password">Password</label>
                                        <Link to="/forgot-password" title="Reset Password" aria-label="Forgot Password" className="text-xs text-brand-600 hover:underline">Forgot Password?</Link>
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="Password"
                                        className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            <div className="flex items-baseline justify-between">
                                <button type="submit" className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full">Login</button>
                            </div>
                            <div className="mt-6 text-center">
                                <Link to="/" className="text-sm text-gray-500 hover:text-brand-600 transition">Back to Home</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
