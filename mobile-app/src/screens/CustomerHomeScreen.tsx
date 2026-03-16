import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Feather } from '@expo/vector-icons';
import { Alert } from 'react-native';
import io from 'socket.io-client';

import { userService } from '../services/user.service';

const SOCKET_SERVER_URL = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:4000';

const CustomerHomeScreen = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();
    const [onlineRiders, setOnlineRiders] = useState<any[]>([]);
    const [activeDelivery, setActiveDelivery] = useState<any>(null);
    const [headerImageError, setHeaderImageError] = useState(false);

    useEffect(() => {
        const fetchRiders = async () => {
            try {
                const riders = await userService.getOnlineRiders();
                setOnlineRiders(riders);
            } catch (error) {
                console.log('Error fetching riders');
            }
        };

        const fetchActiveDelivery = async () => {
            try {
                const res = await api.get('/deliveries/my-deliveries');
                const deliveries = res.data;
                const active = deliveries.find((d: any) => !['DELIVERED', 'CANCELLED'].includes(d.status));
                setActiveDelivery(active || null);
            } catch (error) {
                console.log('Error fetching active delivery');
            }
        };

        fetchRiders();
        fetchActiveDelivery();
        const interval = setInterval(() => {
            fetchRiders();
            fetchActiveDelivery();
        }, 15000); // Updated to poll every 15s for better responsiveness
        return () => clearInterval(interval);
    }, []);

    // Socket.io for Real-time Vendor/System Alerts
    useEffect(() => {
        if (!user) return;
        
        const newSocket = io(SOCKET_SERVER_URL);
        
        newSocket.on('connect', () => {
            newSocket.emit('join', user.id.toString());
        });
        
        newSocket.on('vendor_order_status', (data: any) => {
            const { vendorName, status } = data;
            const messages: any = {
                'ACCEPTED': `Your order from ${vendorName} has been confirmed!`,
                'PREPARING': `Your order from ${vendorName} is being prepared.`,
                'READY_FOR_PICKUP': `Your order from ${vendorName} is ready!`,
                'COMPLETED': `Enjoy your order from ${vendorName}!`
            };
            if (messages[status]) {
                Alert.alert("Order Update 🍲", messages[status]);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const handleBook = () => {
        navigation.navigate('Booking');
    };

    const getImageUrl = (path: string | undefined | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const cleanBase = api.defaults.baseURL?.replace(/\/$/, '').replace('/api', '') || 'http://localhost:4000';
        const cleanPath = path.replace(/\\/g, '/');
        return `${cleanBase}/${cleanPath}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 pt-6 border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mr-3 w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-200"
                    >
                        <Feather name="chevron-left" size={24} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-gray-500">Welcome,</Text>
                        <Text className="text-xl font-bold text-brand-900">{user?.name || 'Customer'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center overflow-hidden border border-gray-200">
                        {/* @ts-ignore */}
                        {user?.passportUrl && !headerImageError ? (
                            <Image
                                // @ts-ignore
                                source={{ uri: getImageUrl(user.passportUrl) }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={() => setHeaderImageError(true)}
                            />
                        ) : (
                            <Text className="text-xl font-bold text-gray-700">
                                {user?.name?.charAt(0).toUpperCase() || '👤'}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Map View */}
                <View className="h-64 rounded-xl mb-6 overflow-hidden border border-gray-200 shadow-sm relative">
                    <MapView
                        style={{ width: '100%', height: '100%' }}
                        initialRegion={{
                            latitude: 12.0022,
                            longitude: 8.5920,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421,
                        }}
                    >
                        {/* User Location */}
                        <Marker
                            coordinate={{ latitude: 12.0022, longitude: 8.5920 }}
                            title="You are here"
                        />

                        {/* Online Riders */}
                        {onlineRiders.map(rider => (
                            <Marker
                                key={rider.id}
                                coordinate={{ latitude: rider.lastLat, longitude: rider.lastLng }}
                                title={rider.name}
                                description="Available Rider"
                            >
                                <View className="bg-white p-1 rounded-full border border-gray-200 shadow">
                                    <Text className="text-lg">🏍️</Text>
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                    <View className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded shadow">
                        <Text className="text-xs text-brand-900 font-bold">Kano, Nigeria</Text>
                    </View>
                </View>

                {/* Active Delivery Banner */}
                {activeDelivery && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('OrderTracking', { deliveryId: activeDelivery.id })}
                        className="bg-brand-50 border border-brand-200 p-4 rounded-xl mb-6 shadow-sm flex-row items-center justify-between"
                    >
                        <View className="flex-1 pr-4">
                            <Text className="text-brand-900 font-bold mb-1">
                                You have an active delivery!
                            </Text>
                            <Text className="text-sm text-brand-700 capitalize">
                                Status: {activeDelivery.status.replace('_', ' ').toLowerCase()}
                            </Text>
                            <Text className="text-xs text-brand-500 mt-1">
                                Tracking No: {activeDelivery.trackingNumber || activeDelivery.id.substring(0, 8)}
                            </Text>
                        </View>
                        <View className="bg-brand-600 px-4 py-2 rounded-lg">
                            <Text className="text-white font-bold text-xs">Track</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <Text className="text-lg font-bold text-gray-900 mb-4">Book a Delivery</Text>

                <View className="flex-row space-x-4 mb-6">
                    <TouchableOpacity onPress={handleBook} className="flex-1 bg-brand-50 p-4 rounded-xl items-center border border-brand-100">
                        <View className="w-12 h-12 bg-brand-200 rounded-full mb-2 items-center justify-center">
                            <Text className="text-2xl">🏍️</Text>
                        </View>
                        <Text className="font-bold text-brand-900">Bike</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBook} className="flex-1 bg-gray-50 p-4 rounded-xl items-center border border-gray-100">
                        <View className="w-12 h-12 bg-gray-200 rounded-full mb-2 items-center justify-center">
                            <Text className="text-2xl">🚗</Text>
                        </View>
                        <Text className="font-bold text-gray-900">Car</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBook} className="flex-1 bg-gray-50 p-4 rounded-xl items-center border border-gray-100">
                        <View className="w-12 h-12 bg-gray-200 rounded-full mb-2 items-center justify-center">
                            <Text className="text-2xl">🚚</Text>
                        </View>
                        <Text className="font-bold text-gray-900">Van</Text>
                    </TouchableOpacity>
                </View>

                <View className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs mb-1">PICKUP LOCATION</Text>
                        <Text className="text-gray-900 font-medium">Select Pickup Location</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100 mb-4"></View>
                    <View>
                        <Text className="text-gray-500 text-xs mb-1">DROPOFF LOCATION</Text>
                        <Text className="text-gray-900 font-medium">Select Dropoff Location</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={handleBook} className="w-full bg-brand-600 p-4 rounded-xl items-center mt-6">
                    <Text className="text-white font-bold text-lg">Send Package</Text>
                </TouchableOpacity>

                <View className="mt-8 mb-4 items-center">
                    <Text className="text-gray-400 text-xs text-center">Powered by: MaSaha Secure Tech</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CustomerHomeScreen;
