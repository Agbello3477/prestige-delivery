import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });
            Alert.alert('Success', 'Password changed successfully');
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to change password';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const toggleShow = (key: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Change Password</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text className="text-gray-500 mb-8">
                        Your new password must be different from your current one.
                    </Text>

                    {/* Old Password */}
                    <Text className="text-gray-700 font-medium mb-2">Current Password</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                        <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900"
                            placeholder="Enter current password"
                            secureTextEntry={!showPasswords.old}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                        />
                        <TouchableOpacity onPress={() => toggleShow('old')}>
                            <Ionicons name={showPasswords.old ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* New Password */}
                    <Text className="text-gray-700 font-medium mb-2">New Password</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                        <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900"
                            placeholder="Enter new password"
                            secureTextEntry={!showPasswords.new}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => toggleShow('new')}>
                            <Ionicons name={showPasswords.new ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <Text className="text-gray-700 font-medium mb-2">Confirm New Password</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
                        <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900"
                            placeholder="Confirm new password"
                            secureTextEntry={!showPasswords.confirm}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => toggleShow('confirm')}>
                            <Ionicons name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center shadow-lg ${loading ? 'bg-brand-400' : 'bg-brand-600'}`}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Update Password</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;
