import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PartnerSidebar = () => {
    const { logoutUser, user } = useAuth();

    // In the future, we can restrict icons based on user.partnerProfile.partnerType

    return (
        <div className="flex flex-col w-64 h-screen bg-gray-900 text-white">
            <div className="flex items-center justify-center p-6 border-b border-gray-700">
                <Link to="/partner-dashboard" className="text-xl font-bold text-green-400">Prestige Partners</Link>
            </div>
            <nav className="flex-1 px-4 space-y-2 py-4">
                <NavLink to="/partner-dashboard" end className={({ isActive }) => `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-gray-800 text-white' : ''}`}>
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Overview
                </NavLink>
                <NavLink to="/partner-dashboard/menu" className={({ isActive }) => `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-gray-800 text-white' : ''}`}>
                    <FileText className="w-5 h-5 mr-3" />
                    My Menu / Items
                </NavLink>
                <NavLink to="/partner-dashboard/orders" className={({ isActive }) => `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-gray-800 text-white' : ''}`}>
                    <Package className="w-5 h-5 mr-3" />
                    Incoming Orders
                </NavLink>
            </nav>
            <div className="p-4 border-t border-gray-700 bg-black/20">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Partner'}</p>
                        <p className="text-xs text-gray-400 font-medium">{user?.role || 'PARTNER'}</p>
                    </div>
                </div>
                <button
                    onClick={logoutUser}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3 text-red-400" />
                    Logout
                </button>
                <div className="mt-4 px-4 pt-4 border-t border-gray-700/50">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold text-center">
                        © {new Date().getFullYear()} MaSha Secure Tech
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartnerSidebar;
