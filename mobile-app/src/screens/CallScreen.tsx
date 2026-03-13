import React, { useEffect } from 'react';
import { View, StyleSheet, Text, BackHandler, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

export default function CallScreen() {
    const { user } = useAuth();
    const navigation = useNavigation<any>();

    const handleExit = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            if (user?.role === 'RIDER') {
                navigation.navigate('RiderDashboard');
            } else {
                navigation.navigate('WelcomeHome');
            }
        }
    };

    useEffect(() => {
        const backAction = () => {
            handleExit();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [user, navigation]);

    return (
        <View style={styles.container}>
            <View className="items-center justify-center p-6 bg-red-50 rounded-3xl mx-6">
                <Feather name="phone-off" size={48} color="#ef4444" className="mb-4" />
                <Text className="text-xl font-bold text-gray-900 text-center mb-2">Calls Disabled</Text>
                <Text className="text-gray-500 text-center text-base mb-6">
                    In-App Voice Calling (ZegoCloud) has been temporarily disabled to run this app inside the standard Expo Go client over the Xcode simulator.
                </Text>

                <TouchableOpacity 
                    onPress={handleExit}
                    className="bg-red-500 w-full py-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f3f4f6', 
    },
});
