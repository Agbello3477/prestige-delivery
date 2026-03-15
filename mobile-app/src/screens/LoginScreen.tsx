import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        try {
            await login(email, password);
            // Navigation is handled by AuthContext state change (RootNavigator should switch stacks ideally)
            // For now, we might need a manual navigate if we are using a single stack
            // But let's assume successful login updates user state.
        } catch (error: any) {
            console.error('Login Error:', error);
            const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
            Alert.alert('Login Failed', message);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 items-center justify-center p-4">
                {/* Logo Section */}
                <View className="items-center mb-8">
                    <Image
                        source={require('../../assets/logo.jpeg')}
                        className="w-32 h-32 rounded-2xl mb-4"
                        resizeMode="contain"
                    />
                </View>

                <Text className="text-3xl font-bold text-brand-900 mb-2">Welcome Back</Text>
                <Text className="text-gray-500 mb-8">Sign in to continue</Text>

                <View className="w-full space-y-4">
                    <View>
                        <Text className="text-gray-700 mb-1 ml-1">Email</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-xl p-4 text-gray-900 bg-gray-50"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 mb-1 ml-1">Password</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-xl p-4 text-gray-900 bg-gray-50 mb-4"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        className="w-full bg-brand-600 p-4 rounded-xl items-center"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Login</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-4">
                        <Text className="text-gray-500">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text className="text-brand-600 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-8 items-center">
                        <Text className="text-gray-400 text-xs text-center">Powered by: MaSha Secure Tech</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
