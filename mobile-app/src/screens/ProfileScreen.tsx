import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

    const handleImageError = (key: string) => {
        setImageErrors(prev => ({ ...prev, [key]: true }));
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text>Please login to view profile</Text>
            </SafeAreaView>
        );
    }

    const ProfileItem = ({ label, value }: { label: string, value: string | undefined | null }) => (
        <View className="mb-4 border-b border-gray-100 pb-2">
            <Text className="text-sm text-gray-500 mb-1">{label}</Text>
            <Text className="text-lg text-gray-900 font-medium">{value || 'N/A'}</Text>
        </View>
    );

    const getImageUrl = (path: string | undefined | null) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        const cleanBase = api.defaults.baseURL?.replace(/\/$/, '').replace('/api', '') || 'http://localhost:4000';
        const cleanPath = path.replace(/\\/g, '/');
        return `${cleanBase}/${cleanPath}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold">My Profile</Text>
                <TouchableOpacity onPress={logout}>
                    <Ionicons name="log-out-outline" size={24} color="#dc2626" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Header Section */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-brand-100 rounded-full items-center justify-center mb-4 overflow-hidden border-2 border-brand-500">
                        {/* We can display passport if available, else initials */}
                        {/* @ts-ignore - passportUrl might be on user object from backend even if not in refined type yet */}
                        {user.passportUrl && !imageErrors['profile'] ? (
                            <Image
                                source={{ uri: getImageUrl(user.passportUrl) }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={() => handleImageError('profile')}
                            />
                        ) : (
                            <Text className="text-3xl font-bold text-brand-700">
                                {user.name.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
                    <View className="bg-brand-100 px-3 py-1 rounded-full mt-2">
                        <Text className="text-brand-700 font-medium text-sm">{user.role}</Text>
                    </View>
                </View>

                {/* Details Section */}
                <View className="bg-gray-50 p-4 rounded-xl mb-6">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Personal Information</Text>
                    <ProfileItem label="Email" value={user.email} />
                    {/* @ts-ignore */}
                    <ProfileItem label="Phone" value={user.phone} />

                    {user.role === 'RIDER' && (
                        <>
                            {/* @ts-ignore */}
                            <ProfileItem label="NIN" value={user.nin} />
                            {/* @ts-ignore */}
                            <ProfileItem label="Address" value={user.address} />
                            {/* @ts-ignore */}
                            <ProfileItem label="State of Origin" value={user.stateOfOrigin} />
                        </>
                    )}
                </View>

                {user.role === 'RIDER' && (
                    <View className="bg-gray-50 p-4 rounded-xl mb-6">
                        <Text className="text-xl font-bold text-gray-900 mb-4">Vehicle Information</Text>
                        {/* @ts-ignore */}
                        <ProfileItem label="Bike Ownership" value={user.isBikeOwner ? "Owner" : "Company Requested"} />
                        {/* @ts-ignore */}
                        {user.isBikeOwner && (
                            <>
                                {/* Assuming we might fetch vehicle details separately or they are included. 
                                    For now displaying basic info if available on user or we'd need to fetch. 
                                    Let's assume backend includes some vehicle info or we rely on what's in user object
                                    User object from login/register might not have full vehicle relation unless included.
                                    For this iteration, we display what we have.
                                */}
                            </>
                        )}
                    </View>
                )}

                {user.role === 'RIDER' && (
                    <View className="bg-gray-50 p-4 rounded-xl mb-6">
                        <Text className="text-xl font-bold text-gray-900 mb-4">Documents</Text>
                        <View className="flex-row justify-between">
                            {/* @ts-ignore */}
                            {user.passportUrl && (
                                <View className="items-center">
                                    <View className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden mb-2 items-center justify-center">
                                        {!imageErrors['passport'] ? (
                                            <Image
                                                source={{ uri: getImageUrl(user.passportUrl) }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                                onError={() => handleImageError('passport')}
                                            />
                                        ) : (
                                            <Ionicons name="person-outline" size={48} color="#9ca3af" />
                                        )}
                                    </View>
                                    <Text className="text-sm text-gray-500">Passport</Text>
                                </View>
                            )}
                            {/* @ts-ignore */}
                            {user.ninSlipUrl && (
                                <View className="items-center">
                                    <View className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden mb-2 items-center justify-center">
                                        {!imageErrors['nin'] ? (
                                            <Image
                                                source={{ uri: getImageUrl(user.ninSlipUrl) }}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                                onError={() => handleImageError('nin')}
                                            />
                                        ) : (
                                            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
                                        )}
                                    </View>
                                    <Text className="text-sm text-gray-500">NIN Slip</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}


                <TouchableOpacity
                    className="w-full bg-brand-50 border border-brand-200 p-4 rounded-xl items-center mt-6 flex-row justify-center"
                    onPress={() => navigation.navigate('DeliveryHistory' as never)}
                >
                    <Ionicons name="list-outline" size={20} color="#0284c7" className="mr-2" />
                    <Text className="text-brand-700 font-bold text-lg">Order History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full bg-brand-50 border border-brand-200 p-4 rounded-xl items-center mt-4 flex-row justify-center"
                    onPress={() => navigation.navigate('ChangePassword' as never)}
                >
                    <Ionicons name="key-outline" size={20} color="#0284c7" className="mr-2" />
                    <Text className="text-brand-700 font-bold text-lg">Change Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-full bg-red-50 border border-red-200 p-4 rounded-xl items-center mt-4"
                    onPress={logout}
                >
                    <Text className="text-red-600 font-bold text-lg">Log Out</Text>
                </TouchableOpacity>
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
