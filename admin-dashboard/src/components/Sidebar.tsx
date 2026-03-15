import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Settings, LogOut, MessageSquare, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logoutUser, user } = useAuth();



    return (
        <div className="flex flex-col w-64 h-screen bg-brand-900 text-white">
            <div className="flex items-center justify-center h-16 border-b border-gray-200">
                <Link to="/" className="text-xl font-bold text-brand-600">Prestige Admin</Link>
            </div>
            <nav className="flex-1 px-4 space-y-2 py-4">
                <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    Overview
                </NavLink>
                <NavLink to="/dashboard/riders" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <Users className="w-5 h-5 mr-3" />
                    Rider Management
                </NavLink>
                <NavLink to="/dashboard/partners" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <Users className="w-5 h-5 mr-3" />
                    Partner Management
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <Users className="w-5 h-5 mr-3" />
                    Add Account
                </NavLink>
                <NavLink to="/dashboard/deliveries" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <Package className="w-5 h-5 mr-3" />
                    Deliveries
                </NavLink>
                <NavLink to="/dashboard/reconciliation" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    COD Reconciliation
                </NavLink>
                <NavLink to="/dashboard/chat" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <MessageSquare className="w-5 h-5 mr-3" />
                    Chat
                </NavLink>
                <NavLink to="/dashboard/settings" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                </NavLink>
                <NavLink to="/dashboard/audit" className={({ isActive }) => `flex items-center px-4 py-2 text-brand-100 hover:bg-brand-800 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-brand-800 text-white' : ''}`}>
                    <ClipboardList className="w-5 h-5 mr-3" />
                    Activity Logs
                </NavLink>
            </nav>
            <div className="p-4 border-t border-brand-600 bg-brand-950/30">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-brand-300 font-medium">{user?.role || 'ADMIN'}</p>
                    </div>
                </div>
                <button
                    onClick={logoutUser}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-brand-100 rounded-lg hover:bg-brand-600 transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
