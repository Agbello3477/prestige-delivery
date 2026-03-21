import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deliveryService } from '../services/delivery.service';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const DeliveryHistoryScreen = () => {
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const fetchDeliveries = async () => {
        try {
            const data = await deliveryService.getMyDeliveries();
            setDeliveries(data);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDeliveries();
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            onPress={() => navigation.navigate('OrderTracking', { deliveryId: item.id })}
            className="bg-white p-4 mb-3 rounded-xl border border-gray-100 shadow-sm"
        >
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold text-brand-600">{item.trackingNumber || `ORD-${item.id.substring(0, 5).toUpperCase()}`}</Text>
                <View className={`px-2 py-1 rounded-full ${getStatusStyle(item.status)}`}>
                    <Text className="text-[10px] font-bold text-white">{item.status}</Text>
                </View>
            </View>
            
            <View className="mb-2">
                <Text className="text-xs text-gray-400">FROM</Text>
                <Text className="text-sm text-gray-700" numberOfLines={1}>{item.pickupAddress}</Text>
            </View>
            
            <View className="mb-3">
                <Text className="text-xs text-gray-400">TO</Text>
                <Text className="text-sm text-gray-700" numberOfLines={1}>{item.dropoffAddress}</Text>
            </View>

            {item.deliveryNote && (
                <View className="mb-3 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <Text className="text-xs text-yellow-800 font-bold">RIDER NOTES</Text>
                    <Text className="text-xs text-yellow-900 mt-1" numberOfLines={2}>{item.deliveryNote}</Text>
                </View>
            )}
            
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-50">
                <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text className="text-brand-900 font-bold">₦{item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500';
            case 'ACCEPTED': return 'bg-blue-500';
            case 'PICKED_UP': return 'bg-purple-500';
            case 'DELIVERED': return 'bg-green-500';
            case 'CANCELLED': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 border-b border-gray-100 bg-white flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <Text className="text-brand-600 font-medium">Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Delivery History</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#b91c1c" />
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#b91c1c']} />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-gray-400">No deliveries found</Text>
                        </View>
                    }
                />
            )}
            <View className="py-4 items-center">
                <Text className="text-gray-400 text-[10px]">Powered by: MaSha Secure Tech</Text>
            </View>
        </SafeAreaView>
    );
};

export default DeliveryHistoryScreen;
