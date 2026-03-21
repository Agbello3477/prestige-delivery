import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Linking, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deliveryService } from '../services/delivery.service';
import { BACKEND_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const OrderTrackingScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { deliveryId } = route.params;
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { logout, user } = useAuth();

    // Rating state
    const [rating, setRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [riderImageError, setRiderImageError] = useState(false);

    const handleCancel = () => {
        Alert.alert(
            "Cancel Delivery",
            "Are you sure you want to cancel this delivery request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            await deliveryService.cancelDelivery(deliveryId);
                            Alert.alert("Success", "Delivery cancelled successfully.");
                            fetchDelivery();
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to cancel delivery.");
                        } finally {
                            setCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    const submitRating = async () => {
        if (rating === 0) return;
        setSubmittingRating(true);
        try {
            await deliveryService.rateDelivery(deliveryId, rating);
            Alert.alert('Success', 'Thank you for rating this delivery!');
            fetchDelivery(); // Refresh to hide prompt and show static stars
        } catch (error) {
            console.error('Rating error:', error);
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        } finally {
            setSubmittingRating(false);
        }
    };

    const fetchDelivery = async () => {
        try {
            const data = await deliveryService.getDeliveryById(deliveryId);
            setDelivery(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDelivery();
        const interval = setInterval(fetchDelivery, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [deliveryId]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#0284c7" />
                <Text className="mt-4 text-gray-500">Loading delivery details...</Text>
            </View>
        );
    }

    if (!delivery) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <Text className="text-red-500">Delivery not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-brand-600 px-4 py-2 rounded-lg">
                    <Text className="text-white">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-yellow-600 bg-yellow-50';
            case 'ACCEPTED': return 'text-blue-600 bg-blue-50';
            case 'PICKED_UP': return 'text-purple-600 bg-purple-50';
            case 'IN_TRANSIT': return 'text-indigo-600 bg-indigo-50';
            case 'DELIVERED': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="p-4 pt-8 mt-4 border-b border-gray-100 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.navigate('WelcomeHome')} className="mr-4">
                        <Text className="text-brand-600 font-bold">Home</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900">Order #{delivery.trackingNumber || delivery.id.substring(0, 8)}</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text className="text-red-500 font-medium text-xs">Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Rating Prompt for Customers */}
                {delivery.status === 'DELIVERED' && !delivery.rating && user?.role === 'CUSTOMER' && (
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-brand-200 mb-6 items-center">
                        <Text className="text-lg font-bold text-gray-900 mb-2">Rate your Rider</Text>
                        <Text className="text-gray-500 text-center mb-4 text-sm">How was your delivery with {delivery.rider?.name}?</Text>
                        <View className="flex-row space-x-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Text className={`text-4xl ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}>★</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            onPress={submitRating}
                            disabled={rating === 0 || submittingRating}
                            className={`w-full p-4 rounded-xl items-center flex-row justify-center ${rating > 0 && !submittingRating ? 'bg-brand-600' : 'bg-gray-300'}`}
                        >
                            {submittingRating ? (
                                <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                            ) : null}
                            <Text className="text-white font-bold">{submittingRating ? 'Submitting...' : 'Submit Rating'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Display Rating if already rated */}
                {delivery.rating && (
                    <View className="bg-white p-4 rounded-xl border border-gray-100 mb-6 items-center flex-row justify-center space-x-2 shadow-sm">
                        <Text className="text-gray-600 font-medium">You rated this trip:</Text>
                        <View className="flex-row">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Text key={star} className={`text-xl ${delivery.rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}>★</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Status Card */}
                <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
                    <Text className={`px-4 py-2 rounded-full font-bold text-sm mb-2 ${getStatusColor(delivery.status)}`}>
                        {delivery.status.replace('_', ' ')}
                    </Text>
                    <Text className="text-gray-500 text-center">
                        {delivery.status === 'PENDING' ? 'Looking for a nearby rider...' :
                            delivery.status === 'ACCEPTED' ? 'Rider is on the way to pickup.' :
                                delivery.status === 'PICKED_UP' ? 'Package picked up.' :
                                    delivery.status === 'DELIVERED' ? 'Package delivered successfully!' : 'Tracking update...'}
                    </Text>
                </View>

                {/* Rider Info (if assigned) */}
                {delivery.rider && (
                    <>
                        <View className="bg-brand-50 p-4 rounded-xl mb-4 border border-brand-100 flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                {delivery.rider.passportUrl && !riderImageError ? (
                                    <Image 
                                        source={{ uri: delivery.rider.passportUrl.startsWith('http') ? delivery.rider.passportUrl : `${BACKEND_URL}/${delivery.rider.passportUrl.replace(/\\\\/g, '/')}` }} 
                                        className="w-16 h-16 rounded-full mr-4 border-2 border-brand-300" 
                                        onError={() => setRiderImageError(true)}
                                    />
                                ) : (
                                    <View className="w-16 h-16 bg-brand-200 rounded-full items-center justify-center mr-4">
                                        <Text className="text-2xl">🚴</Text>
                                    </View>
                                )}
                                <View className="flex-1">
                                    <Text className="text-xs text-brand-700 font-bold uppercase">Your Rider</Text>
                                    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{delivery.rider.name}</Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-gray-600 capitalize mr-2">{delivery.rider.vehicles?.[0]?.type?.toLowerCase() || 'Bike'}</Text>
                                        <Text className="text-xs font-bold text-brand-900 bg-brand-200 px-2 py-0.5 rounded border border-brand-300">
                                            {delivery.rider.vehicles?.[0]?.plateNumber || 'No Plate'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Contact Buttons */}
                        <View className="flex-row justify-between mb-6 space-x-2">
                            <TouchableOpacity
                                onPress={() => {
                                    if (delivery.rider?.phone) {
                                        Linking.openURL(`tel:${delivery.rider.phone}`);
                                    } else {
                                        Alert.alert('Error', 'Rider phone number not available');
                                    }
                                }}
                                className="flex-1 bg-green-500 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-sm">📞 Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (delivery.rider?.phone) {
                                        Linking.openURL(`whatsapp://send?phone=${delivery.rider.phone.replace(/\+/g, '')}`);
                                    } else {
                                        Alert.alert('Error', 'Rider WhatsApp not available');
                                    }
                                }}
                                className="flex-1 bg-emerald-600 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-sm">💬 WA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate('Call', { callId: `call_${delivery.id}` });
                                }}
                                className="flex-1 bg-brand-600 p-3 rounded-lg flex-row justify-center items-center shadow-sm"
                            >
                                <Text className="text-white font-bold text-sm">🌐 VoIP</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Delivery Details */}
                <View className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs mb-1">PICKUP</Text>
                        <Text className="text-gray-900 font-medium">{delivery.pickupAddress}</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100 mb-4"></View>
                    <View>
                        <Text className="text-gray-500 text-xs mb-1">DROPOFF</Text>
                        <Text className="text-gray-900 font-medium">{delivery.dropoffAddress}</Text>
                    </View>

                    {delivery.deliveryNote && (
                        <>
                            <View className="h-[1px] bg-gray-100 my-4"></View>
                            <View className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <Text className="text-yellow-800 text-xs font-bold mb-1">RIDER INSTRUCTIONS / NOTES</Text>
                                <Text className="text-yellow-900 font-medium text-sm">{delivery.deliveryNote}</Text>
                            </View>
                        </>
                    )}

                    <View className="h-[1px] bg-gray-100 my-4"></View>
                    <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <Text className="text-gray-500 text-xs font-bold">PAYMENT METHOD</Text>
                        <Text className="text-brand-900 font-bold text-sm bg-brand-50 px-2 py-1 rounded">
                            {delivery.paymentMethod === 'COD' ? '💵 Cash on Delivery' : delivery.paymentMethod === 'TRANSFER' ? '🏦 Bank Transfer' : '💳 POS / Card'}
                        </Text>
                    </View>

                    {/* Bank Transfer Details */}
                    {delivery.paymentMethod === 'TRANSFER' && (
                        <View className="bg-brand-50 p-4 rounded-xl mt-4 border border-brand-200">
                            <Text className="text-brand-900 font-bold mb-2">Transfer Payment To:</Text>
                            <Text className="text-brand-800 text-sm mb-1"><Text className="font-bold">Account Name:</Text> PRESTIGE DELIVERY AND LOGISTICS SERVICES LTD</Text>
                            <Text className="text-brand-800 text-sm mb-1"><Text className="font-bold">Account No.:</Text> 1029689348</Text>
                            <Text className="text-brand-800 text-sm"><Text className="font-bold">Bank Name:</Text> UBA</Text>
                            <Text className="text-xs text-brand-600 mt-2 font-medium italic">Please transfer the exact amount (₦{delivery.price}) and show receipt to rider.</Text>
                        </View>
                    )}
                </View>

                {/* Cancel Button */}
                {delivery.status === 'PENDING' && user?.role === 'CUSTOMER' && (
                    <TouchableOpacity 
                        onPress={handleCancel}
                        disabled={cancelling}
                        className="w-full bg-red-50 border border-red-200 p-4 rounded-xl items-center mt-4 mb-2 flex-row justify-center"
                    >
                        {cancelling && <ActivityIndicator size="small" color="#ef4444" className="mr-2" />}
                        <Text className="text-red-600 font-bold text-lg">{cancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
                    </TouchableOpacity>
                )}

                {/* Map Placeholder */}
                {/* Live Map Tracking */}
                <View className="mt-6 h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    {delivery.pickupLat && delivery.dropoffLat ? (
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: delivery.pickupLat,
                                longitude: delivery.pickupLng,
                                latitudeDelta: 0.0922,
                                longitudeDelta: 0.0421,
                            }}
                        >
                            <Marker
                                coordinate={{ latitude: delivery.pickupLat, longitude: delivery.pickupLng }}
                                title="Pickup"
                                pinColor="green"
                            />
                            <Marker
                                coordinate={{ latitude: delivery.dropoffLat, longitude: delivery.dropoffLng }}
                                title="Dropoff"
                                pinColor="red"
                            />
                            {delivery.currentLocation && (
                                <Marker
                                    coordinate={{
                                        latitude: delivery.currentLocation.lat,
                                        longitude: delivery.currentLocation.lng
                                    }}
                                    title="Rider"
                                    description={delivery.rider?.name}
                                >
                                    <View className="bg-brand-600 p-2 rounded-full border-2 border-white">
                                        <Text className="text-white text-xs font-bold">🚴</Text>
                                    </View>
                                </Marker>
                            )}
                        </MapView>
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-gray-400">Map unavailable (missing coordinates)</Text>
                        </View>
                    )}
                </View>
                <View className="mt-8 mb-4 items-center">
                    <Text className="text-gray-400 text-xs text-center">Powered by: MaSha Secure Tech</Text>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

export default OrderTrackingScreen;
