import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const VendorOrderCartScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { cart, vendor } = route.params || { cart: {}, vendor: null };

    const [currentCart, setCurrentCart] = useState<Record<number, any>>(cart);
    const [deliveryOption, setDeliveryOption] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const cartItems = Object.values(currentCart);
    const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = deliveryOption === 'DELIVERY' ? 1200 : 0;
    const grandTotal = cartTotal + deliveryFee;

    const handleAddToCart = (item: any) => {
        setCurrentCart(prev => {
            const next = { ...prev };
            if (next[item.id]) {
                next[item.id].quantity += 1;
            } else {
                next[item.id] = { ...item, quantity: 1 };
            }
            return next;
        });
    };

    const handleRemoveFromCart = (itemId: number) => {
        setCurrentCart(prev => {
            const next = { ...prev };
            if (next[itemId]) {
                if (next[itemId].quantity > 1) {
                    next[itemId].quantity -= 1;
                } else {
                    delete next[itemId];
                }
            }
            return next;
        });
    };

    const submitOrder = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty.');
            return;
        }
        if (deliveryOption === 'DELIVERY' && !deliveryAddress.trim()) {
            Alert.alert('Address Required', 'Please enter a delivery address.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const orderPayload = {
                partnerId: vendor.partnerProfile.id,
                items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: parseFloat(item.price) })),
                totalAmount: grandTotal,
                deliveryOption,
                deliveryAddress: deliveryOption === 'DELIVERY' ? deliveryAddress : undefined,
                deliveryFee: deliveryOption === 'DELIVERY' ? deliveryFee : undefined,
                deliveryNote: deliveryNote || undefined
            };
            
            await api.post('/partners/orders', orderPayload);
            
            Alert.alert('Order Placed!', 'Your order has been sent to the vendor successfully.', [
                { text: 'OK', onPress: () => navigation.navigate('DeliveryHistory') }
            ]);
        } catch (error: any) {
            console.error('Failed to submit vendor order', error);
            let errorMessage = error.response?.data?.message || 'Failed to place the order. Please try again.';
            
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const detailedErrors = error.response.data.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join('\n');
                errorMessage += `\n\nDetails:\n${detailedErrors}`;
            }

            Alert.alert('Checkout Error', errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900">Prestige Fresh Checkout</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {cartItems.length === 0 ? (
                    <View className="py-20 items-center">
                        <Feather name="shopping-cart" size={48} color="#9ca3af" />
                        <Text className="text-gray-500 mt-4">Your cart is empty</Text>
                    </View>
                ) : (
                    <>
                        {cartItems.map((item, idx) => (
                            <View key={idx} className="flex-row justify-between items-center mb-6">
                                <View className="flex-1">
                                    <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
                                    <Text className="text-gray-500">₦{item.price}</Text>
                                </View>
                                <View className="flex-row items-center bg-gray-100 rounded-xl p-1">
                                    <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} className="p-2">
                                        <Feather name="minus" size={20} color="#0369a1" />
                                    </TouchableOpacity>
                                    <Text className="font-bold px-4 text-lg w-12 text-center">{item.quantity}</Text>
                                    <TouchableOpacity onPress={() => handleAddToCart(item)} className="p-2">
                                        <Feather name="plus" size={20} color="#0369a1" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <View className="border-t border-gray-100 mt-4 pt-6 pb-6">
                            <Text className="text-gray-900 font-bold mb-4 text-lg">Order Type</Text>
                            <View className="flex-row bg-gray-100 p-1 rounded-xl mb-6">
                                <TouchableOpacity 
                                    className={`flex-1 py-4 rounded-lg items-center ${deliveryOption === 'PICKUP' ? 'bg-white shadow-sm' : ''}`}
                                    onPress={() => setDeliveryOption('PICKUP')}
                                >
                                    <Text className={`font-bold ${deliveryOption === 'PICKUP' ? 'text-brand-700' : 'text-gray-500'}`}>Store Pickup</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    className={`flex-1 py-4 rounded-lg items-center ${deliveryOption === 'DELIVERY' ? 'bg-white shadow-sm' : ''}`}
                                    onPress={() => setDeliveryOption('DELIVERY')}
                                >
                                    <Text className={`font-bold ${deliveryOption === 'DELIVERY' ? 'text-brand-700' : 'text-gray-500'}`}>Delivery</Text>
                                </TouchableOpacity>
                            </View>

                            {deliveryOption === 'DELIVERY' && (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-bold mb-2">Delivery Address</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-gray-900 mb-4"
                                        placeholder="Enter your full address..."
                                        value={deliveryAddress}
                                        onChangeText={setDeliveryAddress}
                                        multiline
                                    />
                                    <Text className="text-gray-700 font-bold mb-2">Call Instructions / Rider Notes (Optional)</Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-gray-900"
                                        placeholder="e.g. Call this number when you arrive..."
                                        value={deliveryNote}
                                        onChangeText={setDeliveryNote}
                                        multiline
                                        style={{ minHeight: 80 }}
                                    />
                                </View>
                            )}

                            <View className="bg-gray-50 p-6 rounded-2xl space-y-3">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">Subtotal</Text>
                                    <Text className="font-medium text-gray-900">₦{cartTotal.toLocaleString()}</Text>
                                </View>
                                {deliveryOption === 'DELIVERY' && (
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-500">Delivery Fee</Text>
                                        <Text className="font-medium text-gray-900">₦{deliveryFee.toLocaleString()}</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">Service Fee</Text>
                                    <Text className="font-medium text-gray-900">₦0</Text>
                                </View>
                                <View className="border-t border-gray-200 my-2" />
                                <View className="flex-row justify-between">
                                    <Text className="text-xl font-bold text-gray-900">Total</Text>
                                    <Text className="text-xl font-bold text-brand-600">₦{grandTotal.toLocaleString()}</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <View className="p-6 border-t border-gray-100 bg-white shadow-up">
                <TouchableOpacity
                    onPress={submitOrder}
                    disabled={isSubmitting || cartItems.length === 0}
                    className={`w-full py-4 rounded-2xl flex-row justify-center items-center ${isSubmitting || cartItems.length === 0 ? 'bg-gray-300' : 'bg-brand-600'}`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-lg font-bold">Place Order - ₦{grandTotal.toLocaleString()}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default VendorOrderCartScreen;
