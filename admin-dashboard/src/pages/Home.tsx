import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Truck, Shield, Clock } from 'lucide-react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LoginForm from '../components/LoginForm';

const Home = () => {
    const location = useLocation();

    const scrollToLogin = useCallback(() => {
        const element = document.getElementById('login-section');
        element?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (location.hash === '#login' || window.location.pathname === '/login') {
            scrollToLogin();
        }
    }, [location, scrollToLogin]);


    return (
        <div className="bg-white flex flex-col min-h-screen">
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes scroll {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(12px); opacity: 0; }
                }
                .animate-scroll {
                    animation: scroll 1.5s ease-in-out infinite;
                }
            `}</style>
            {/* Elegant Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center text-gray-900 border-none outline-none">
                    <Logo />
                    <div className="flex items-center gap-6">
                        <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-400">
                            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
                            <a href="#about" className="hover:text-brand-600 transition-colors">About</a>
                        </nav>
                        <button 
                            onClick={scrollToLogin}
                            className="bg-brand-600 text-white px-8 py-3 rounded-2xl hover:bg-brand-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-500/20 active:scale-95"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section with Modern Vibe */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-brand-50 px-4 py-2 rounded-full text-brand-700 text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
                        <Truck size={14} />
                        Next-Gen Logistics
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-8">
                        Reliable Delivery & <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 font-extrabold">Logistics Excellence</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium leading-relaxed mb-12">
                        Fast, secure, and efficient delivery solutions tailored for your needs. 
                        Serving Kano State and beyond with cutting-edge technology and human touch.
                    </p>
                    
                    <button 
                        onClick={scrollToLogin}
                        className="flex flex-col items-center mx-auto text-gray-400 hover:text-brand-600 transition-colors group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-4">Explore More</span>
                        <div className="w-10 h-16 border-2 border-gray-200 rounded-full flex justify-center p-2">
                            <div className="w-1 h-3 bg-gray-300 rounded-full animate-scroll" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Login Portal Section - "The Middle" */}
            <div id="login-section" className="py-24 relative overflow-hidden bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                    <div className="mb-12">
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Official Portal</h2>
                        <p className="text-gray-500 font-medium">Log in to manage your shipments, partners, and logistics operation.</p>
                    </div>
                    
                    <div className="w-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-500/10 rounded-full blur-[100px] -z-10" />
                        <LoginForm />
                    </div>
                </div>
            </div>

            {/* Features with Premium Touch */}
            <div id="features" className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { 
                                icon: Truck, 
                                title: 'Ultra-Fast Delivery', 
                                desc: 'Optimized routing algorithms ensure your packages reach their destination in record time.' 
                            },
                            { 
                                icon: Shield, 
                                title: 'Bank-Grade Security', 
                                desc: 'Your trust is our priority. We guarantee safe handling and full insurance for all items.' 
                            },
                            { 
                                icon: Clock, 
                                title: 'Real-time Tracking', 
                                desc: 'Monitor every milestone from pickup to dropoff with our proprietary intelligent map system.' 
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl border border-gray-100 hover:border-brand-100 hover:shadow-2xl hover:shadow-brand-500/5 transition-all group">
                                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Home;
