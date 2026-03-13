import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const WelcomeHomeScreen = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation<any>();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleComingSoon = (serviceName: string) => {
        Alert.alert('Coming Soon', `${serviceName} is not available at the moment. Please check back later!`);
    };

    const ServiceButton = ({ title, icon, onPress, colorClass }: { title: string, icon: any, onPress: () => void, colorClass: string }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center p-4 rounded-xl mb-4 shadow-sm border ${colorClass}`}
        >
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 opacity-90 shadow-sm">
                <Feather name={icon as any} size={24} color={colorClass.includes('gray') ? "#4b5563" : "#0369a1"} />
            </View>
            <Text className="text-lg font-bold text-gray-800 flex-1">{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 bg-white border-b border-gray-200 shadow-sm">
                <View>
                    <Text className="text-xl font-bold text-brand-900">{getGreeting()},</Text>
                    <Text className="text-2xl font-extrabold text-gray-900 mt-1">{user?.name || 'Customer'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center overflow-hidden border border-gray-300 shadow-sm">
                    <Feather name="user" color="#4b5563" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-6">
                <Text className="text-gray-500 text-lg font-medium mb-6 px-1">What Would You Like to do Today...</Text>

                <ServiceButton
                    title="1. Prestige Delivery"
                    icon="package"
                    onPress={() => navigation.navigate('CustomerHome')}
                    colorClass="bg-blue-50 border-blue-200"
                />

                <ServiceButton
                    title="2. Prestige Food/Snacks"
                    icon="coffee"
                    onPress={() => navigation.navigate('VendorList', { vendorType: 'FOOD', title: 'Food & Snacks' })}
                    colorClass="bg-orange-50 border-orange-200"
                />

                <ServiceButton
                    title="3. Prestige Automobile"
                    icon="truck"
                    onPress={() => navigation.navigate('VendorList', { vendorType: 'AUTO', title: 'Automobile Partners' })}
                    colorClass="bg-green-50 border-green-200"
                />

                <ServiceButton
                    title="4. E-Commerce Delivery"
                    icon="shopping-bag"
                    onPress={() => navigation.navigate('VendorList', { vendorType: 'E_COMMERCE', title: 'E-Commerce Partners' })}
                    colorClass="bg-purple-50 border-purple-200"
                />

                <ServiceButton
                    title="5. Prestige Pharmacy"
                    icon="plus-square"
                    onPress={() => navigation.navigate('VendorList', { vendorType: 'PHARMACY', title: 'Pharmacies' })}
                    colorClass="bg-red-50 border-red-200"
                />

            </ScrollView>

            <View className="py-6 items-center bg-gray-50">
                <Text className="text-gray-400 text-xs font-medium">Powered by: MaSha Secure Tech</Text>
            </View>
        </SafeAreaView>
    );
};

export default WelcomeHomeScreen;
