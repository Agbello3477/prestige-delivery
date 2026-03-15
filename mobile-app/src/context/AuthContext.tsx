import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api, { setAuthToken, BACKEND_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { usePushNotifications } from '../hooks/usePushNotifications';

export interface User {
    id: number;
    email: string;
    name: string;
    phone?: string;
    role: 'ADMIN' | 'RIDER' | 'CUSTOMER' | 'PARTNER';
    isOnline?: boolean;
    isVerified?: boolean;
    isRejected?: boolean;
    rejectionReason?: string;
    isBlocked?: boolean;
    isSuspended?: boolean;
    suspensionEndDate?: string;
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
            // IMPORTANT: Never set Content-Type manually for FormData in Axios/React-Native. 
            // It breaks the boundary string.
            const headers: any = isFormData ? {} : { 'Content-Type': 'application/json' };

            // Backup current token and CLEAR it for this specific public call
            const originalToken = api.defaults.headers.common['Authorization'];
            delete api.defaults.headers.common['Authorization'];

            try {
                // Pre-check: Verify we can even reach the server
                console.log(`[DEBUG] Attempting connection to: ${BACKEND_URL}/api/health`);
                
                await api.post('/auth/register', data, { headers });
                // User is not automatically logged in. They will be redirected to Login.
            } finally {
                // RESTORE the token for future calls if it existed
                if (originalToken) {
                    api.defaults.headers.common['Authorization'] = originalToken;
                }
            }
        } catch (error: any) {
            console.error('Registration failed - Final Diagnosis:');
            if (error.response) {
                console.error('SERVER RESPONDED WITH ERROR:', error.response.status, error.response.data);
            } else if (error.request) {
                console.error('NO RESPONSE FROM SERVER - Possible Network/URL blocker.');
            } else {
                console.error('REQUEST SETUP FAILED:', error.message);
            }
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
