import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../services/api';

const VendorListScreen = () => {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { vendorType, title } = route.params || { vendorType: 'FOOD', title: 'Food & Snacks' };

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await api.get(`/partners/public?type=${vendorType}`);
                setVendors(response.data);
            } catch (error) {
                console.error('Error fetching vendors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVendors();
    }, [vendorType]);

    const renderVendor = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => {
                if (vendorType === 'PHARMACY') {
                    navigation.navigate('PharmacyPrescriptionUpload', { vendor: item });
                } else {
                    navigation.navigate('VendorMenu', { vendor: item });
                }
            }}
            className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100 flex-row items-center"
        >
            <View className="w-16 h-16 bg-brand-100 rounded-full items-center justify-center mr-4">
                <Feather name={vendorType === 'FOOD' ? 'coffee' : 'home'} size={24} color="#0369a1" />
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">{item.partnerProfile?.businessName || item.name}</Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>{item.partnerProfile?.address || 'Kano State'}</Text>

                <View className="flex-row items-center mt-2">
                    <Feather name="star" size={14} color="#f59e0b" />
                    <Text className="text-xs font-medium text-gray-600 ml-1 block">4.5 (120+ ratings)</Text>
                </View>
            </View>
            <Feather name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                    <Feather name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0369a1" />
                    <Text className="text-gray-500 mt-4">Finding vendors near you...</Text>
                </View>
            ) : (
                <FlatList
                    data={vendors}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderVendor}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={() => (
                        <View className="flex-1 justify-center items-center pt-20">
                            <Feather name="info" size={48} color="#9ca3af" />
                            <Text className="text-lg font-bold text-gray-700 mt-4 text-center">No Vendors Available</Text>
                            <Text className="text-sm text-gray-500 text-center mt-2">We couldn't find any {title.toLowerCase()} vendors at the moment.</Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

export default VendorListScreen;
