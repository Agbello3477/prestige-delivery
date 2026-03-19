import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setIsSubmitted(true);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to process request';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
                <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                    <Ionicons name="mail-unread-outline" size={40} color="#16a34a" />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-2">Check your email</Text>
                <Text className="text-gray-500 text-center mb-8">
                    We've sent password recovery instructions to {email}.
                </Text>
                <TouchableOpacity
                    className="w-full bg-brand-600 py-4 rounded-xl items-center shadow-lg"
                    onPress={() => navigation.navigate('Login' as never)}
                >
                    <Text className="text-white font-bold text-lg">Back to Login</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center p-4">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900">Forgot Password</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Text className="text-gray-500 mb-8">
                        Enter the email address associated with your account and we'll send you instructions to reset your password.
                    </Text>

                    <Text className="text-gray-700 font-medium mb-2">Email Address</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8">
                        <Ionicons name="mail-outline" size={20} color="#64748b" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900"
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center shadow-lg ${loading ? 'bg-brand-400' : 'bg-brand-600'}`}
                        onPress={handleForgotPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Send Instructions</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPasswordScreen;
