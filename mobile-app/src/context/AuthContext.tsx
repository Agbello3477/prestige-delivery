import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api, { setAuthToken } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../hooks/usePushNotifications';

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: 'ADMIN' | 'RIDER' | 'CUSTOMER';
    isOnline?: boolean;
    isVerified?: boolean;
    isRejected?: boolean;
    rejectionReason?: string;
    nin?: string;
    address?: string;
    stateOfOrigin?: string;
    passportUrl?: string;
    ninSlipUrl?: string;
    isBikeOwner?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true); // Start loading true to check auth
    const { expoPushToken } = usePushNotifications();

    // Check for stored token on mount
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const storedUser = await AsyncStorage.getItem('user');

                if (token && storedUser) {
                    setAuthToken(token);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Failed to load user", error);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            setAuthToken(token);
            setUser(user);

            // Register the generated push token for the backend
            if (expoPushToken) {
                try {
                    await api.post('/auth/push-token', { token: expoPushToken });
                } catch (pushErr) {
                    console.error("Failed to save push token on login:", pushErr);
                }
            }

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: any) => {
        setLoading(true);
        try {
            const isFormData = data instanceof FormData;
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;

            await api.post('/auth/register', data, { headers });
            // User is not automatically logged in. They will be redirected to Login.
        } catch (error) {
            console.error('Registration failed', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setUser(null);
        setAuthToken(null);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
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
