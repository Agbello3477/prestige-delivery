import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER',
        nin: '',
        address: '',
        stateOfOrigin: '',
        isBikeOwner: false,
        requestBike: false,
        plateNumber: '',
        model: '',
        chassisNumber: '',
        gender: '',
    });

    const [passportImage, setPassportImage] = useState<string | null>(null);
    const [ninImage, setNinImage] = useState<string | null>(null);

    const pickImage = async (field: 'passport' | 'nin') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        Alert.alert('Select Option', 'Choose an option', [
            {
                text: 'Camera',
                onPress: async () => {
                    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
                    if (cameraStatus.status !== 'granted') {
                        Alert.alert('Permission denied', 'Camera permission is required');
                        return;
                    }
                    let result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.7,
                    });
                    if (!result.canceled) {
                        if (field === 'passport') setPassportImage(result.assets[0].uri);
                        else setNinImage(result.assets[0].uri);
                    }
                }
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    let result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.7,
                    });
                    if (!result.canceled) {
                        if (field === 'passport') setPassportImage(result.assets[0].uri);
                        else setNinImage(result.assets[0].uri);
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
            Alert.alert('Error', 'Please fill in basic fields');
            return;
        }

        if (formData.role === 'RIDER') {
            if (!formData.nin || !formData.address || !formData.stateOfOrigin) {
                Alert.alert('Error', 'Please fill in all Rider details');
                return;
            }
            if (!passportImage || !ninImage) {
                Alert.alert('Error', 'Please upload both Passport and NIN slip');
                return;
            }
            if (!formData.isBikeOwner && !formData.requestBike) {
                Alert.alert('Error', 'Please select if you have a bike or need one');
                return;
            }
            if (formData.isBikeOwner && (!formData.plateNumber || !formData.model || !formData.chassisNumber)) {
                Alert.alert('Error', 'Please provide Bike Details');
                return;
            }
        }

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('phone', formData.phone);
            data.append('role', formData.role);
            if (formData.gender) data.append('gender', formData.gender);

            if (formData.role === 'RIDER') {
                data.append('nin', formData.nin);
                data.append('address', formData.address);
                data.append('stateOfOrigin', formData.stateOfOrigin);
                data.append('isBikeOwner', String(formData.isBikeOwner));

                if (formData.isBikeOwner) {
                    data.append('plateNumber', formData.plateNumber);
                    // Note: We might need to add model/chassis to backend if schema supports or put in metadata
                }

                if (passportImage) {
                    const filename = passportImage.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename!);
                    const type = match ? `image/${match[1]}` : `image`;
                    // @ts-ignore
                    data.append('passport', { uri: passportImage, name: filename, type });
                }

                if (ninImage) {
                    const filename = ninImage.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename!);
                    const type = match ? `image/${match[1]}` : `image`;
                    // @ts-ignore
                    data.append('ninSlip', { uri: ninImage, name: filename, type });
                }
            }

            await register(data);
            Alert.alert(
                'Success',
                'Account created! Please log in to continue.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            console.error('Registration error detail:', error.response?.data);
            const data = error.response?.data;
            let msg = data?.message || 'Registration failed';
            
            // If it's a validation error, show the first few specific issues
            if (data?.errors && Array.isArray(data.errors)) {
                const specificErrors = data.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('\n');
                msg = `${msg}:\n${specificErrors}`;
            } else if (data?.error) {
                msg = `${msg}: ${data.error}`;
            }

            Alert.alert('Error', msg);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
                <Text className="text-3xl font-bold text-brand-900 mb-2">Create Account</Text>
                <Text className="text-gray-500 mb-8">Join Prestige Delivery today</Text>

                <View className="flex-row justify-between mb-6 bg-gray-100 p-1 rounded-xl">
                    <TouchableOpacity
                        className="flex-1 p-3 rounded-lg items-center"
                        style={formData.role === 'CUSTOMER' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : {}}
                        onPress={() => setFormData({ ...formData, role: 'CUSTOMER' })}
                    >
                        <Text style={{ fontWeight: 'bold', color: formData.role === 'CUSTOMER' ? '#0f172a' : '#6b7280' }}>Customer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 p-3 rounded-lg items-center"
                        style={formData.role === 'RIDER' ? { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 } : {}}
                        onPress={() => setFormData({ ...formData, role: 'RIDER' })}
                    >
                        <Text style={{ fontWeight: 'bold', color: formData.role === 'RIDER' ? '#0f172a' : '#6b7280' }}>Rider</Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-4">
                    <TextInput
                        className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 mb-4"
                        placeholder="Full Name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                    <TextInput
                        className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 mb-4"
                        placeholder="Email Address"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 mb-4"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        className="w-full border border-gray-300 rounded-xl p-4 bg-gray-50 mb-4"
                        placeholder="Password"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        secureTextEntry
                    />

                    {formData.role === 'CUSTOMER' && (
                        <View className="mb-4">
                            <Text className="text-gray-700 mb-2 ml-1 font-semibold">Gender</Text>
                            <View className="flex-row space-x-2">
                                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setFormData({ ...formData, gender: g })}
                                        className={`flex-1 p-3 rounded-xl border items-center ${formData.gender === g ? 'bg-brand-600 border-brand-600' : 'bg-gray-50 border-gray-300'}`}
                                    >
                                        <Text className={`font-bold ${formData.gender === g ? 'text-white' : 'text-gray-700'}`}>
                                            {g.charAt(0) + g.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {formData.role === 'RIDER' ? (
                        <View style={{ paddingTop: 16, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
                            <Text style={{ fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Rider Details</Text>

                            <TextInput
                                style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB', marginBottom: 16 }}
                                placeholder="NIN Number"
                                value={formData.nin}
                                onChangeText={(text) => setFormData({ ...formData, nin: text })}
                            />
                            <TextInput
                                style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB', marginBottom: 16 }}
                                placeholder="Residential Address"
                                value={formData.address}
                                onChangeText={(text) => setFormData({ ...formData, address: text })}
                            />
                            <TextInput
                                style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB', marginBottom: 16 }}
                                placeholder="State of Origin"
                                value={formData.stateOfOrigin}
                                onChangeText={(text) => setFormData({ ...formData, stateOfOrigin: text })}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                                <TouchableOpacity
                                    onPress={() => pickImage('passport')}
                                    style={{ flex: 1, height: 128, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', overflow: 'hidden', marginRight: 8 }}
                                >
                                    {passportImage ? (
                                        <Image source={{ uri: passportImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    ) : (
                                        <Text style={{ color: '#6B7280', fontWeight: '500' }}>Upload Passport</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => pickImage('nin')}
                                    style={{ flex: 1, height: 128, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D1D5DB', overflow: 'hidden', marginLeft: 8 }}
                                >
                                    {ninImage ? (
                                        <Image source={{ uri: ninImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                    ) : (
                                        <Text style={{ color: '#6B7280', fontWeight: '500' }}>Upload NIN Slip</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontWeight: '500', marginBottom: 8, color: '#111827' }}>Bike Information</Text>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
                                    onPress={() => setFormData({ ...formData, isBikeOwner: true, requestBike: false })}
                                >
                                    <View style={{ width: 24, height: 24, borderWidth: 1, borderRadius: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderColor: formData.isBikeOwner ? '#0284c7' : '#D1D5DB', backgroundColor: formData.isBikeOwner ? '#0284c7' : 'transparent' }}>
                                        {formData.isBikeOwner ? <View style={{ width: 10, height: 10, backgroundColor: 'white', borderRadius: 5 }} /> : null}
                                    </View>
                                    <Text style={{ color: '#1F2937' }}>I am using My Own Bike</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center' }}
                                    onPress={() => setFormData({ ...formData, isBikeOwner: false, requestBike: true })}
                                >
                                    <View style={{ width: 24, height: 24, borderWidth: 1, borderRadius: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderColor: formData.requestBike ? '#0284c7' : '#D1D5DB', backgroundColor: formData.requestBike ? '#0284c7' : 'transparent' }}>
                                        {formData.requestBike ? <View style={{ width: 10, height: 10, backgroundColor: 'white', borderRadius: 5 }} /> : null}
                                    </View>
                                    <Text style={{ color: '#1F2937' }}>I am requesting a Bike</Text>
                                </TouchableOpacity>
                            </View>

                            {formData.isBikeOwner ? (
                                <View style={{ marginBottom: 16 }}>
                                    <TextInput
                                        style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB', marginBottom: 16 }}
                                        placeholder="Bike Model"
                                        value={formData.model}
                                        onChangeText={(text) => setFormData({ ...formData, model: text })}
                                    />
                                    <TextInput
                                        style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB', marginBottom: 16 }}
                                        placeholder="Bike Plate Number"
                                        value={formData.plateNumber}
                                        onChangeText={(text) => setFormData({ ...formData, plateNumber: text })}
                                    />
                                    <TextInput
                                        style={{ width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, backgroundColor: '#F9FAFB' }}
                                        placeholder="Bike Chassis Number"
                                        value={formData.chassisNumber}
                                        onChangeText={(text) => setFormData({ ...formData, chassisNumber: text })}
                                    />
                                </View>
                            ) : null}
                        </View>
                    ) : null}

                    <TouchableOpacity
                        className="w-full bg-brand-600 p-4 rounded-xl items-center mt-6"
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-4">
                        <Text className="text-gray-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text className="text-brand-600 font-bold">Login</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mt-8 items-center">
                        <Text className="text-gray-400 text-xs text-center">Powered by: MaSha Secure Tech</Text>
                    </View>

                    <View className="h-20" />
                </View>
            </ScrollView>
        </SafeAreaView >
    );
};

export default RegisterScreen;
