import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { login, logout, getCurrentUser } from '../services/auth.service';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginUser: (email: string, password: string) => Promise<User>;
    logoutUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => getCurrentUser());
    const [loading] = useState(false);

    const loginUser = async (email: string, password: string) => {
        const data = await login(email, password);

        if (data.user.role !== 'ADMIN' && data.user.role !== 'PARTNER') {
            throw new Error('Access denied. Administrator or Partner privileges required to access this dashboard.');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);

        return data.user;
    };

    const logoutUser = () => {
        logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
