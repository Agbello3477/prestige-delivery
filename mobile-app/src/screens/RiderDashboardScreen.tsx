import { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Image } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { deliveryService } from '../services/delivery.service';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

// Extract base URL from api service
// @ts-ignore
const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://2.3.0.190:4000';

const RiderDashboardScreen = () => {
    const { user } = useAuth();
    const navigation = useNavigation();
    const [isOnline, setIsOnline] = useState(user?.isOnline || false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeDelivery, setActiveDelivery] = useState<any>(null);

    // Sync local state with user prop if it changes
    useEffect(() => {
        if (user?.isOnline !== undefined) {
            setIsOnline(user.isOnline);
        }
    }, [user]);

    const toggleOnlineStatus = async (value: boolean) => {
        setIsOnline(value); // Optimistic update
        try {
            await api.patch('/auth/status', { isOnline: value });
        } catch (error) {
            console.error('Failed to update status', error);
            setIsOnline(!value); // Revert on error
            Alert.alert('Error', 'Failed to update online status');
        }
    };

    const fetchRequests = useCallback(async () => {
        if (!isOnline || activeDelivery) return;
        setLoading(true);
        try {
            const data = await deliveryService.getPendingDeliveries();
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [isOnline, activeDelivery]);

    const checkActiveDelivery = useCallback(async () => {
        try {
            const myDeliveries = await deliveryService.getMyDeliveries();
            // Find the first active delivery (ACCEPTED, PICKED_UP, IN_TRANSIT)
            const active = myDeliveries.find((d: any) =>
                ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)
            );
            setActiveDelivery(active || null);
        } catch (error) {
            console.error("Error checking active delivery:", error);
        }
    }, []);

    // Global Socket for System Notifications
    useEffect(() => {
        if (!user) return;
        const socketConnection: Socket = io(SOCKET_URL);

        socketConnection.on('connect', () => {
            socketConnection.emit('join', user.id.toString());
        });

        socketConnection.on('system_notification', (data: { title: string, message: string, type: string }) => {
            // Re-fetch user or trigger reload if needed to update UI state
            Alert.alert(data.title, data.message);
        });

        return () => {
            socketConnection.disconnect();
        };
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            checkActiveDelivery();
        }, [checkActiveDelivery])
    );

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            if (isOnline) {
                // Fetch first immediately
                if (!activeDelivery) fetchRequests();

                interval = setInterval(async () => {
                    try {
                        const location = await Location.getCurrentPositionAsync({});

                        // 1. Always update global rider location (for map)
                        const { userService } = require('../services/user.service');
                        await userService.updateLocation(location.coords.latitude, location.coords.longitude);

                        // 2. If active delivery, update tracking log
                        if (activeDelivery && ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(activeDelivery.status)) {
                            await deliveryService.updateLocation(
                                activeDelivery.id,
                                location.coords.latitude,
                                location.coords.longitude
                            );
                        } else if (!activeDelivery) {
                            fetchRequests();
                        }
                    } catch (err: any) {
                        console.error('Location update failed', err.message || err);
                    }
                }, 10000); // 10 seconds
            } else {
                setRequests([]);
            }
        };

        startTracking();
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOnline, activeDelivery, fetchRequests]);

    const handleAccept = async (id: string) => {
        try {
            await deliveryService.updateDeliveryStatus(id, 'ACCEPTED');
            Alert.alert('Success', 'Delivery accepted!');
            checkActiveDelivery();
        } catch (error) {
            Alert.alert('Error', 'Failed to accept delivery.');
        }
    };

    const handleStatusUpdate = async (status: string) => {
        if (!activeDelivery) return;
        try {
            await deliveryService.updateDeliveryStatus(activeDelivery.id, status);
            Alert.alert('Success', `Status updated to ${status}`);
            checkActiveDelivery();
        } catch (error) {
            Alert.alert('Error', 'Failed to update status.');
        }
    };

    const handleProofUpload = async (proof: string, type: 'VIDEO' | 'SIGNATURE') => {
        if (!activeDelivery) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('status', 'DELIVERED');
            formData.append('proofType', type);

            if (type === 'VIDEO') {
                // @ts-ignore
                formData.append('proof', {
                    uri: proof,
                    name: 'proof_video.mp4',
                    type: 'video/mp4'
                });
            } else {
                // Signature is base64
                formData.append('proofUrl', proof);
            }

            await api.patch(`/deliveries/${activeDelivery.id}/status`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert('Success', 'Delivery Confirmed!');
            checkActiveDelivery();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to confirm delivery.');
        } finally {
            setLoading(false);
        }
    };

    const openMap = (address: string) => {
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(link);
    };

    const renderRequestItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-lg font-bold text-gray-900">₦{item.price || 'Estimate...'}</Text>
                    <Text className="text-gray-500 text-xs">Order #{item.trackingNumber || item.id.substring(0, 8)}</Text>
                </View>
                <View className="bg-brand-50 px-2 py-1 rounded-lg">
                    <Text className="text-brand-700 text-xs font-bold">New Request</Text>
                </View>
            </View>
            <View className="mb-2"><Text className="text-gray-700">{item.pickupAddress}</Text></View>
            <View className="mb-4"><Text className="text-gray-700">{item.dropoffAddress}</Text></View>
            <View className="bg-orange-50 p-2 rounded-lg border border-orange-100 mb-4 flex-row justify-between items-center">
                <Text className="text-orange-800 text-xs font-bold">COLLECT PAYMENT VIA:</Text>
                <Text className="text-orange-900 font-bold">
                    {item.paymentMethod === 'COD' ? '💵 Cash' : item.paymentMethod === 'TRANSFER' ? '🏦 Transfer' : '💳 POS Machine'}
                </Text>
            </View>
            <View className="flex-row space-x-3">
                <TouchableOpacity className="flex-1 bg-gray-100 p-3 rounded-lg items-center" onPress={() => { }}>
                    <Text className="font-bold text-gray-700">Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-brand-600 p-3 rounded-lg items-center" onPress={() => handleAccept(item.id)}>
                    <Text className="font-bold text-white">Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderActiveDelivery = () => {
        if (!activeDelivery) return null;
        const isPickupPhase = activeDelivery.status === 'ACCEPTED';
        const targetAddress = isPickupPhase ? activeDelivery.pickupAddress : activeDelivery.dropoffAddress;

        return (
            <View className="bg-white p-4 rounded-xl shadow-md border border-brand-100 flex-1">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-bold text-brand-900">Current Delivery</Text>
                    <Text className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-1 rounded">#{activeDelivery.trackingNumber}</Text>
                </View>

                <Text className="text-sm text-gray-500 mb-2">Status: <Text className="font-bold">{activeDelivery.status}</Text></Text>

                <View className="h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: activeDelivery.pickupLat || 12.0022,
                            longitude: activeDelivery.pickupLng || 8.5920,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                    >
                        <Marker coordinate={{ latitude: activeDelivery.pickupLat || 12.0022, longitude: activeDelivery.pickupLng || 8.5920 }} title="Pickup" pinColor="green" />
                        <Marker coordinate={{ latitude: activeDelivery.dropoffLat || 12.00, longitude: activeDelivery.dropoffLng || 8.60 }} title="Dropoff" pinColor="red" />
                    </MapView>
                    <TouchableOpacity
                        className="absolute bottom-2 right-2 bg-blue-600 px-4 py-2 rounded-lg shadow"
                        onPress={() => openMap(targetAddress)}
                    >
                        <Text className="text-white font-bold text-xs">Navigate</Text>
                    </TouchableOpacity>
                </View>

                {/* Contact Options (Moved off the map) */}
                {activeDelivery.customer?.phone && (
                    <View className="flex-row justify-between mb-4 space-x-2">
                        <TouchableOpacity
                            className="flex-1 bg-green-500 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            onPress={() => Linking.openURL(`tel:${activeDelivery.customer.phone}`)}
                        >
                            <Text className="text-white font-bold text-sm">📞 Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-emerald-600 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            onPress={() => Linking.openURL(`whatsapp://send?phone=${activeDelivery.customer.phone.replace(/\+/g, '')}`)}
                        >
                            <Text className="text-white font-bold text-sm">💬 WA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-brand-600 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            onPress={() => (navigation as any).navigate('Call', { callId: `call_${activeDelivery.id}` })}
                        >
                            <Text className="text-white font-bold text-sm">🌐 VoIP</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="mb-4"><Text className="text-xs text-gray-400">Pickup: {activeDelivery.pickupAddress}</Text></View>
                <View className="mb-4"><Text className="text-xs text-gray-400">Dropoff: {activeDelivery.dropoffAddress}</Text></View>

                <View className="bg-orange-50 p-3 rounded-xl border border-orange-200 mb-6 flex-row justify-between items-center">
                    <Text className="text-orange-800 text-sm font-bold">EXPECTED PAYMENT:</Text>
                    <Text className="text-orange-900 font-bold text-lg">
                        {activeDelivery.paymentMethod === 'COD' ? '💵 Cash' : activeDelivery.paymentMethod === 'TRANSFER' ? '🏦 Transfer' : '💳 POS'}
                    </Text>
                </View>

                {activeDelivery.status === 'ACCEPTED' && (
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            className="flex-1 bg-green-500 p-4 rounded-xl items-center"
                            onPress={() => (navigation as any).navigate('Chat', {
                                receiverId: activeDelivery.customerId,
                                receiverName: activeDelivery.customer?.name || 'Customer'
                            })}
                        >
                            <Text className="text-white font-bold text-lg">Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-brand-600 p-4 rounded-xl items-center"
                            onPress={() => handleStatusUpdate('PICKED_UP')}
                        >
                            <Text className="text-white font-bold text-lg">Pickup</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {activeDelivery.status === 'PICKED_UP' && (
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            className="flex-1 bg-green-500 p-4 rounded-xl items-center"
                            onPress={() => (navigation as any).navigate('Chat', {
                                receiverId: activeDelivery.customerId,
                                receiverName: activeDelivery.customer?.name || 'Customer'
                            })}
                        >
                            <Text className="text-white font-bold text-lg">Chat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-green-600 p-4 rounded-xl items-center"
                            onPress={() => {
                                Alert.alert(
                                    "Confirm Delivery",
                                    "Select Proof of Delivery Method:",
                                    [
                                        {
                                            text: "1. Video (10 Seconds)",
                                            onPress: () => (navigation as any).navigate('RecordProof', {
                                                onVideoRecorded: async (uri: string) => {
                                                    await handleProofUpload(uri, 'VIDEO');
                                                }
                                            })
                                        },
                                        {
                                            text: "2. Signature",
                                            onPress: () => (navigation as any).navigate('SignatureCapture', {
                                                onOK: async (signature: string) => {
                                                    await handleProofUpload(signature, 'SIGNATURE');
                                                }
                                            })
                                        },
                                        { text: "Cancel", style: "cancel" }
                                    ]
                                );
                            }}
                        >
                            <Text className="text-white font-bold text-lg">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
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
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <View>
                    <Text className="text-gray-500 text-xs">Welcome back,</Text>
                    <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Profile')}>
                    <View className="w-12 h-12 bg-brand-100 rounded-full items-center justify-center overflow-hidden border-2 border-brand-500">
                        {/* @ts-ignore */}
                        {user?.passportUrl ? (
                            <Image
                                // @ts-ignore
                                source={{ uri: getImageUrl(user.passportUrl) }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-xl font-bold text-brand-700">
                                {user?.name?.charAt(0).toUpperCase() || '👤'}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {user?.isRejected ? (
                <View className="p-6 m-4 bg-red-50 border border-red-200 rounded-2xl items-center">
                    <Text className="text-4xl mb-4">🚫</Text>
                    <Text className="text-xl font-bold text-red-900 mb-2">Application Declined</Text>
                    <Text className="text-center text-red-600 mb-4">
                        {user.rejectionReason || "Your application to join as a rider was tracking declined."}
                    </Text>
                    <Text className="text-sm text-center text-red-400">
                        Please contact support for more information or edit your profile and resubmit your documents.
                    </Text>
                </View>
            ) : user?.isBlocked ? (
                <View className="p-6 m-4 bg-red-800 border border-red-900 rounded-2xl items-center shadow-lg">
                    <Text className="text-4xl mb-4">⛔</Text>
                    <Text className="text-xl font-bold text-white mb-2">Account Blocked</Text>
                    <Text className="text-center text-red-100 mb-4 whitespace-pre-wrap">
                        You have been permanently blocked from the platform and will no longer receive any delivery requests.
                    </Text>
                    <Text className="text-sm font-bold text-center text-white bg-black/20 px-4 py-2 rounded-lg">
                        Please contact the Admin if you believe this is an error.
                    </Text>
                </View>
            ) : user?.isSuspended ? (
                <View className="p-6 m-4 bg-orange-100 border border-orange-300 rounded-2xl items-center shadow-md flex-1 justify-center">
                    <Text className="text-5xl mb-4">⏳</Text>
                    <Text className="text-2xl font-black text-orange-900 mb-2">Account Suspended</Text>
                    <Text className="text-center text-orange-800 text-base mb-6 px-2">
                        You are suspended at the moment and cannot accept new deliveries.
                    </Text>
                    <View className="bg-white p-4 rounded-xl border border-orange-200 w-full mb-6">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suspension Ends On:</Text>
                        <Text className="text-lg font-bold text-gray-900">
                            {user.suspensionEndDate ? new Date(user.suspensionEndDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                        </Text>
                    </View>
                    <Text className="text-sm font-semibold text-center text-orange-700 bg-orange-200/50 px-4 py-3 rounded-lg w-full">
                        Your account will automatically resume normal operations after this period.
                    </Text>
                </View>
            ) : (
                <>
                    {!activeDelivery && (
                        <View className="p-4 bg-brand-50 mx-4 mt-4 rounded-xl flex-row justify-between items-center border border-brand-100">
                            <Text className="font-bold text-brand-900 text-lg">{isOnline ? 'You are Online' : 'You are Offline'}</Text>
                            <Switch
                                value={isOnline}
                                onValueChange={toggleOnlineStatus}
                                trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
                                thumbColor={isOnline ? "#fff" : "#f4f4f5"}
                            />
                        </View>
                    )}

                    <View className="flex-1 p-4">
                        {activeDelivery ? (
                            renderActiveDelivery()
                        ) : (
                            <>
                                <Text className="text-lg font-bold text-gray-900 mb-4">Delivery Requests</Text>
                                {loading && requests.length === 0 ? (
                                    <ActivityIndicator color="#0284c7" />
                                ) : (
                                    <FlatList
                                        data={requests}
                                        renderItem={renderRequestItem}
                                        keyExtractor={(item) => item.id.toString()}
                                        ListEmptyComponent={
                                            <View className="items-center py-10">
                                                <Text className="text-gray-400">
                                                    {!user?.isVerified
                                                        ? "Your account is pending verification. You will see orders here once approved."
                                                        : "No requests available right now."
                                                    }
                                                </Text>
                                            </View>
                                        }
                                        showsVerticalScrollIndicator={false}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </>
            )}
            <View className="mb-4 items-center">
                <Text className="text-gray-400 text-xs text-center">Powered by: MaSaha Secure Tech</Text>
            </View>
        </SafeAreaView>
    );
};

export default RiderDashboardScreen;
