import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const VendorMenuScreen = () => {
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<Record<number, any>>({});
    const [showCart, setShowCart] = useState(false);

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
    const handleCheckout = () => {
        if (totalItems === 0) return;
        navigation.navigate('VendorOrderCart', { cart, vendor });
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
                                <TouchableOpacity onPress={handleCheckout} className="bg-white px-4 py-2 rounded-lg">
                                    <Text className="text-brand-700 font-bold">Checkout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </>
            )}
        </SafeAreaView>
    );
};

export default VendorMenuScreen;
