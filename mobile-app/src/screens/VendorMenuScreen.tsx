import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, Modal, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const VendorMenuScreen = () => {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<Record<number, any>>({});
    const [showCart, setShowCart] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryOption, setDeliveryOption] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');

    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { vendor } = route.params || { vendor: null };

    useEffect(() => {
        if (!vendor?.id) {
            navigation.goBack();
            return;
        }

        const fetchMenu = async () => {
            try {
                const response = await api.get(`/partners/menu/${vendor.partnerProfile.id}`);
                setMenuItems(response.data);
            } catch (error) {
                console.error('Error fetching menu items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [vendor]);

    const handleAddToCart = (item: any) => {
        setCart(prev => {
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
        setCart(prev => {
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

    const cartItems = Object.values(cart);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const deliveryFee = deliveryOption === 'DELIVERY' ? 1200 : 0;
    const grandTotal = cartTotal + deliveryFee;

    const submitOrder = async () => {
        if (cartItems.length === 0) return;
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
            setShowCart(false);
            setCart({});
            Alert.alert('Order Placed!', 'Your order has been sent to the vendor successfully. You will be notified when it is ready or dispatched.', [
                { text: 'OK', onPress: () => navigation.navigate('DeliveryHistory') }
            ]);
        } catch (error) {
            console.error('Failed to submit vendor order', error);
            Alert.alert('Error', 'Failed to place the order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderMenuItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100 flex-row">
            <View className="flex-1 pr-4">
                <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
                <Text className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description || 'No description available'}</Text>
                <Text className="text-brand-600 font-bold">₦{item.price}</Text>
            </View>
            <View className="items-end justify-between">
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="w-20 h-20 rounded-lg mb-2" />
                ) : (
                    <View className="w-20 h-20 bg-gray-100 rounded-lg mb-2 items-center justify-center">
                        <Feather name="image" size={24} color="#9ca3af" />
                    </View>
                )}

                {item.isAvailable ? (
                    cart[item.id] ? (
                        <View className="flex-row items-center bg-gray-100 rounded-lg">
                            <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} className="p-2">
                                <Feather name="minus" size={16} color="#0369a1" />
                            </TouchableOpacity>
                            <Text className="font-bold px-2">{cart[item.id].quantity}</Text>
                            <TouchableOpacity onPress={() => handleAddToCart(item)} className="p-2">
                                <Feather name="plus" size={16} color="#0369a1" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleAddToCart(item)}
                            className="bg-brand-50 border border-brand-200 px-4 py-1.5 rounded-lg"
                        >
                            <Text className="text-brand-700 font-medium text-sm">Add</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <Text className="text-red-500 font-medium text-sm italic">Sold Out</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <Feather name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800 line-clamp-1 flex-1 text-center px-2">
                    {vendor?.partnerProfile?.businessName || 'Vendor Menu'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0369a1" />
                    <Text className="text-gray-500 mt-4">Cooking up the menu...</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={menuItems}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMenuItem}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        ListEmptyComponent={() => (
                            <View className="flex-1 justify-center items-center pt-20">
                                <Feather name="file-text" size={48} color="#9ca3af" />
                                <Text className="text-lg font-bold text-gray-700 mt-4 text-center">Empty Menu</Text>
                                <Text className="text-sm text-gray-500 text-center mt-2">This vendor hasn't added any items yet.</Text>
                            </View>
                        )}
                    />

                    {/* Floating Cart Button */}
                    {totalItems > 0 && (
                        <View className="absolute bottom-6 left-4 right-4 bg-brand-600 rounded-xl shadow-lg flex-row items-center justify-between p-4 px-6 overflow-hidden">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-white/20 w-8 h-8 rounded-full items-center justify-center">
                                    <Text className="text-white font-bold">{totalItems}</Text>
                                </View>
                                <Text className="text-white font-medium text-lg">View Cart</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <Text className="text-white font-bold text-lg">₦{cartTotal}</Text>
                                <TouchableOpacity onPress={() => setShowCart(true)} className="bg-white px-4 py-2 rounded-lg">
                                    <Text className="text-brand-700 font-bold">Checkout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </>
            )}

            {/* Cart Modal Replacement (Absolute View to preserve Navigation Context) */}
            {showCart && (
                <View className="absolute flex-1 bg-black/50 justify-end z-[100] top-0 bottom-0 left-0 right-0" style={{ elevation: 100 }}>
                    <View className="bg-white rounded-t-3xl min-h-[50%] max-h-[90%] flex flex-col" style={{ marginTop: 'auto' }}>
                        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                            <Text className="text-2xl font-bold text-gray-900">Your Order</Text>
                            <TouchableOpacity onPress={() => setShowCart(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 px-6 pt-4">
                            {cartItems.map((item, idx) => (
                                <View key={idx} className="flex-row justify-between items-center mb-6">
                                    <View className="flex-1">
                                        <Text className="font-bold text-gray-800 text-base">{item.name}</Text>
                                        <Text className="text-gray-500">₦{item.price}</Text>
                                    </View>
                                    <View className="flex-row items-center bg-gray-100 rounded-lg">
                                        <TouchableOpacity onPress={() => handleRemoveFromCart(item.id)} className="p-2">
                                            <Feather name="minus" size={16} color="#0369a1" />
                                        </TouchableOpacity>
                                        <Text className="font-bold px-2 w-6 text-center">{item.quantity}</Text>
                                        <TouchableOpacity onPress={() => handleAddToCart(item)} className="p-2">
                                            <Feather name="plus" size={16} color="#0369a1" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <View className="border-t border-gray-200 mt-4 pt-6 pb-6">
                                <View className="flex-row bg-gray-100 p-1 rounded-lg mb-6">
                                    <TouchableOpacity 
                                        className={`flex-1 py-3 rounded-md items-center ${deliveryOption === 'PICKUP' ? 'bg-white shadow-sm' : ''}`}
                                        onPress={() => setDeliveryOption('PICKUP')}
                                    >
                                        <Text className={`font-bold ${deliveryOption === 'PICKUP' ? 'text-brand-700' : 'text-gray-500'}`}>Store Pickup</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        className={`flex-1 py-3 rounded-md items-center ${deliveryOption === 'DELIVERY' ? 'bg-white shadow-sm' : ''}`}
                                        onPress={() => setDeliveryOption('DELIVERY')}
                                    >
                                        <Text className={`font-bold ${deliveryOption === 'DELIVERY' ? 'text-brand-700' : 'text-gray-500'}`}>Delivery</Text>
                                    </TouchableOpacity>
                                </View>

                                {deliveryOption === 'DELIVERY' && (
                                    <View className="mb-6">
                                        <Text className="text-gray-700 font-bold mb-2">Delivery Address</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-900 mb-3"
                                            placeholder="Enter your full address..."
                                            value={deliveryAddress}
                                            onChangeText={setDeliveryAddress}
                                            multiline
                                        />
                                        <Text className="text-gray-700 font-bold mb-2">Call Instructions / Rider Notes (Optional)</Text>
                                        <TextInput
                                            className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-900"
                                            placeholder="e.g. Call this number when you arrive..."
                                            value={deliveryNote}
                                            onChangeText={setDeliveryNote}
                                            multiline
                                            style={{ minHeight: 60 }}
                                        />
                                    </View>
                                )}

                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-500">Subtotal</Text>
                                    <Text className="font-medium">₦{cartTotal}</Text>
                                </View>
                                {deliveryOption === 'DELIVERY' && (
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-gray-500">Delivery Fee</Text>
                                        <Text className="font-medium">₦{deliveryFee}</Text>
                                    </View>
                                )}
                                <View className="flex-row justify-between mb-4">
                                    <Text className="text-gray-500">Service Fee</Text>
                                    <Text className="font-medium">₦0</Text>
                                </View>
                                <View className="flex-row justify-between bg-brand-50 p-4 rounded-xl">
                                    <Text className="text-lg font-bold text-brand-900">Total</Text>
                                    <Text className="text-lg font-bold text-brand-900">₦{grandTotal}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="p-6 border-t border-gray-100 bg-white shadow-up">
                            <TouchableOpacity
                                onPress={submitOrder}
                                disabled={isSubmitting}
                                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isSubmitting ? 'bg-gray-400' : 'bg-brand-600'}`}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-lg font-bold">Place Order - ₦{grandTotal}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default VendorMenuScreen;
