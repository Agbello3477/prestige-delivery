import { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { deliveryService } from '../services/delivery.service';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyBMQRMt57PLMW4UIS5-9q46YwhjdaXxw0I'; // In production, move to .env

const BookingScreen = ({ navigation }: any) => {
    const mapRef = useRef<MapView>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Details, 2: Confirmation
    const [estimate, setEstimate] = useState<{ price: number; distance: string; duration: string } | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const { logout } = useAuth();

    // Use Context instead of local state
    const {
        pickupAddress, setPickupAddress,
        pickupLat, setPickupLat,
        pickupLng, setPickupLng,
        dropoffAddress, setDropoffAddress,
        dropoffLat, setDropoffLat,
        dropoffLng, setDropoffLng,
        vehicleType, setVehicleType,
        resetBooking
    } = useBooking();

    const [onlineRiders, setOnlineRiders] = useState<any[]>([]);

    useEffect(() => {
        const fetchRiders = async () => {
            try {
                // We can import userService here
                const { userService } = require('../services/user.service');
                const riders = await userService.getOnlineRiders();
                setOnlineRiders(riders);
            } catch (error) {
                console.log('Error fetching riders');
            }
        };

        fetchRiders();
        const interval = setInterval(fetchRiders, 30000); // 30s
        return () => clearInterval(interval);
    }, []);


    // Default to Kano, Nigeria
    const [mapRegion, setMapRegion] = useState({
        latitude: 12.0022,
        longitude: 8.5920,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    // Update map region when pickup or dropoff changes
    useEffect(() => {
        if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
            mapRef.current?.fitToCoordinates([
                { latitude: pickupLat, longitude: pickupLng },
                { latitude: dropoffLat, longitude: dropoffLng }
            ], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        } else if (pickupLat && pickupLng) {
            mapRef.current?.animateToRegion({
                latitude: pickupLat,
                longitude: pickupLng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);


    const handleGetEstimate = async () => {
        if (!pickupAddress || !dropoffAddress) {
            Alert.alert('Error', 'Please enter both pickup and dropoff locations');
            return;
        }

        const currentData = {
            pickupAddress,
            pickupLat: pickupLat || 0,
            pickupLng: pickupLng || 0,
            dropoffAddress,
            dropoffLat: dropoffLat || 0,
            dropoffLng: dropoffLng || 0,
            vehicleType
        };

        setLoading(true);
        try {
            const data = await deliveryService.getEstimate(currentData as any);
            setEstimate(data);
            setStep(2);
        } catch (error) {
            console.error('Estimate Error:', error);
            Alert.alert('Error', 'Could not get estimate');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        try {
            const currentData = {
                pickupAddress,
                pickupLat: pickupLat || 0,
                pickupLng: pickupLng || 0,
                dropoffAddress,
                dropoffLat: dropoffLat || 0,
                dropoffLng: dropoffLng || 0,
                vehicleType,
                paymentMethod,
                price: estimate?.price,
                distanceKm: parseFloat(estimate?.distance?.replace(' km', '') || '0')
            };

            console.log('Sending Delivery Data:', currentData);

            const response = await deliveryService.createDelivery(currentData as any);
            const deliveryId = response.delivery.id;

            resetBooking(); // Reset form on success

            Alert.alert('Success', 'Order created successfully!', [
                { text: 'Track Order', onPress: () => navigation.navigate('OrderTracking', { deliveryId }) }
            ]);
        } catch (error: any) {
            console.error('Create Order Error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleSelect = (type: string) => {
        if (type !== 'BIKE') {
            Alert.alert('Coming Soon', `${type === 'CAR' ? 'Car' : 'Van'} delivery is coming soon!`);
            return;
        }
        setVehicleType(type);
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100 z-50 bg-white">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} className="mr-4">
                        <Text className="text-brand-600 font-medium">Back</Text>
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-gray-900">New Booking</Text>
                </View>
                <TouchableOpacity onPress={logout}>
                    <Text className="text-red-500 font-medium text-xs">Logout</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                {/* Google Map */}
                <View className="h-1/3 w-full bg-gray-100">
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={StyleSheet.absoluteFill}
                        initialRegion={mapRegion}
                    >
                        {pickupLat && pickupLng && <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Pickup" pinColor="green" />}
                        {dropoffLat && dropoffLng && <Marker coordinate={{ latitude: dropoffLat, longitude: dropoffLng }} title="Dropoff" pinColor="red" />}
                        {pickupLat && pickupLng && dropoffLat && dropoffLng && (
                            <Polyline
                                coordinates={[
                                    { latitude: pickupLat, longitude: pickupLng },
                                    { latitude: dropoffLat, longitude: dropoffLng }
                                ]}
                                strokeColor="#000" // Black
                                strokeWidth={3}
                            />
                        )}

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
                </View>

                {/* Form Content */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                    <View className="flex-1 p-4 bg-white">
                        {step === 1 ? (
                            <>
                                <Text className="text-gray-500 mb-2 font-medium">Select Vehicle</Text>
                                <View className="flex-row space-x-4 mb-4">
                                    {(['BIKE', 'CAR', 'VAN'] as const).map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => handleVehicleSelect(type)}
                                            className={`flex-1 p-4 rounded-xl items-center border ${vehicleType === type ? 'bg-brand-50 border-brand-500' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                                        >
                                            <Text className={`font-bold ${vehicleType === type ? 'text-brand-900' : 'text-gray-500'}`}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Google AutoComplete Inputs */}
                                <View className="z-50 mb-4 h-auto min-h-[64px]">
                                    <Text className="text-gray-500 text-xs mb-1">PICKUP</Text>
                                    <GooglePlacesAutocomplete
                                        placeholder="Search Pickup Location"
                                        onPress={(data, details = null) => {
                                            if (details) {
                                                const lat = details.geometry.location.lat;
                                                const lng = details.geometry.location.lng;
                                                setPickupLat(lat);
                                                setPickupLng(lng);
                                                setPickupAddress(data.description);
                                            }
                                        }}
                                        query={{
                                            key: GOOGLE_MAPS_API_KEY,
                                            language: 'en',
                                            components: 'country:ng',
                                        }}
                                        fetchDetails={true}
                                        styles={{
                                            container: { flex: 0 },
                                            textInput: {
                                                height: 44,
                                                color: '#111827',
                                                fontSize: 16,
                                                borderBottomWidth: 1,
                                                borderColor: '#e5e7eb',
                                                backgroundColor: 'white'
                                            },
                                            listView: {
                                                position: 'absolute',
                                                top: 45, left: 0, right: 0,
                                                backgroundColor: 'white',
                                                borderRadius: 5,
                                                flex: 1,
                                                elevation: 5,
                                                zIndex: 1000,
                                            },
                                            description: { color: '#4b5563' }
                                        }}
                                        enablePoweredByContainer={false}
                                        keyboardShouldPersistTaps='always'
                                        textInputProps={{
                                            defaultValue: pickupAddress || ''
                                        }}
                                    />
                                </View>

                                <View className="z-40 mb-2 h-auto min-h-[64px]">
                                    <Text className="text-gray-500 text-xs mb-1">DROPOFF</Text>
                                    <GooglePlacesAutocomplete
                                        placeholder="Search Dropoff Location"
                                        onPress={(data, details = null) => {
                                            if (details) {
                                                const lat = details.geometry.location.lat;
                                                const lng = details.geometry.location.lng;
                                                setDropoffLat(lat);
                                                setDropoffLng(lng);
                                                setDropoffAddress(data.description);
                                            }
                                        }}
                                        query={{
                                            key: GOOGLE_MAPS_API_KEY,
                                            language: 'en',
                                            components: 'country:ng',
                                        }}
                                        fetchDetails={true}
                                        styles={{
                                            container: { flex: 0 },
                                            textInput: {
                                                height: 44,
                                                color: '#111827',
                                                fontSize: 16,
                                                borderBottomWidth: 1,
                                                borderColor: '#e5e7eb',
                                                backgroundColor: 'white'
                                            },
                                            listView: {
                                                position: 'absolute',
                                                top: 45, left: 0, right: 0,
                                                backgroundColor: 'white',
                                                borderRadius: 5,
                                                flex: 1,
                                                elevation: 5,
                                                zIndex: 1000,
                                            },
                                            description: { color: '#4b5563' }
                                        }}
                                        enablePoweredByContainer={false}
                                        keyboardShouldPersistTaps='always'
                                        textInputProps={{
                                            defaultValue: dropoffAddress || ''
                                        }}
                                    />
                                </View>

                                <View className="mt-auto mb-4">
                                    <TouchableOpacity
                                        className="w-full bg-brand-600 p-4 rounded-xl items-center"
                                        onPress={handleGetEstimate}
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Get Estimate</Text>}
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <ScrollView className="flex-1">
                                {/* Confirmation View */}
                                <View className="bg-brand-50 p-6 rounded-2xl items-center mb-8 border border-brand-100">
                                    <Text className="text-gray-500 mb-1">Estimated Cost</Text>
                                    <Text className="text-4xl font-bold text-brand-900">₦{String(estimate?.price || 0)}</Text>
                                    <View className="flex-row space-x-4 mt-4">
                                        <Text className="text-gray-600 font-medium">{String(estimate?.distance || '')}</Text>
                                        <Text className="text-gray-300">•</Text>
                                        <Text className="text-gray-600 font-medium">{String(estimate?.duration || '')}</Text>
                                    </View>
                                </View>

                                <View className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6">
                                    <View className="mb-4">
                                        <Text className="text-xs text-gray-500">PICKUP</Text>
                                        <Text className="text-gray-900 font-medium">{pickupAddress}</Text>
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-500">DROPOFF</Text>
                                        <Text className="text-gray-900 font-medium">{dropoffAddress}</Text>
                                    </View>
                                </View>

                                {/* Payment Method Selector */}
                                <View className="mb-6">
                                    <Text className="text-gray-900 font-bold text-lg mb-3">Payment Method</Text>
                                    <View className="space-y-3">
                                        <TouchableOpacity
                                            onPress={() => setPaymentMethod('COD')}
                                            className={`flex-row items-center p-4 rounded-xl border ${paymentMethod === 'COD' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
                                        >
                                            <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${paymentMethod === 'COD' ? 'border-brand-600 bg-brand-600' : 'border-gray-400'}`}>
                                                {paymentMethod === 'COD' && <View className="w-2 h-2 rounded-full bg-white" />}
                                            </View>
                                            <Text className={`font-medium ${paymentMethod === 'COD' ? 'text-brand-900 font-bold' : 'text-gray-700'}`}>💵 Cash on Delivery (COD)</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setPaymentMethod('TRANSFER')}
                                            className={`flex-row items-center p-4 rounded-xl border ${paymentMethod === 'TRANSFER' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
                                        >
                                            <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${paymentMethod === 'TRANSFER' ? 'border-brand-600 bg-brand-600' : 'border-gray-400'}`}>
                                                {paymentMethod === 'TRANSFER' && <View className="w-2 h-2 rounded-full bg-white" />}
                                            </View>
                                            <Text className={`font-medium ${paymentMethod === 'TRANSFER' ? 'text-brand-900 font-bold' : 'text-gray-700'}`}>🏦 Bank Transfer / In-App</Text>
                                        </TouchableOpacity>

                                        {paymentMethod === 'TRANSFER' && (
                                            <View className="bg-brand-50 p-4 rounded-xl mt-1 mb-2 border border-brand-200">
                                                <Text className="text-brand-900 font-bold mb-2">Pay To:</Text>
                                                <Text className="text-brand-800 text-sm mb-1"><Text className="font-bold">Account Name:</Text> PRESTIGE DELIVERY AND LOGISTICS SERVICES LTD</Text>
                                                <Text className="text-brand-800 text-sm mb-1"><Text className="font-bold">Account No.:</Text> 1029689348</Text>
                                                <Text className="text-brand-800 text-sm"><Text className="font-bold">Bank Name:</Text> UBA</Text>
                                                <Text className="text-xs text-brand-600 mt-2 font-medium italic">Please transfer the exact amount and proceed to Confirm Booking.</Text>
                                            </View>
                                        )}

                                        <TouchableOpacity
                                            onPress={() => setPaymentMethod('POS')}
                                            className={`flex-row items-center p-4 rounded-xl border ${paymentMethod === 'POS' ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-200'}`}
                                        >
                                            <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${paymentMethod === 'POS' ? 'border-brand-600 bg-brand-600' : 'border-gray-400'}`}>
                                                {paymentMethod === 'POS' && <View className="w-2 h-2 rounded-full bg-white" />}
                                            </View>
                                            <Text className={`font-medium ${paymentMethod === 'POS' ? 'text-brand-900 font-bold' : 'text-gray-700'}`}>💳 POS / Card Payment</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    className="w-full bg-brand-600 p-4 rounded-xl items-center"
                                    onPress={handleCreateOrder}
                                    disabled={loading}
                                >
                                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm Booking</Text>}
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </KeyboardAvoidingView>
                <View className="mb-4 items-center">
                    <Text className="text-gray-400 text-xs text-center">Powered by: MaSaha Secure Tech</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default BookingScreen;
