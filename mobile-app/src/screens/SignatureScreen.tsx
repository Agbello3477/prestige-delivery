import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SignatureCaptureScreen = () => {
    const ref = useRef<any>(null);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { onOK } = route.params || {};

    const handleOK = (signature: string) => {
        // Signature is base64 string
        if (onOK) {
            onOK(signature);
        }
        navigation.goBack();
    };

    const handleClear = () => {
        ref.current?.clearSignature();
    };

    const handleConfirm = () => {
        ref.current?.readSignature();
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text className="text-brand-600 text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold">Sign Here</Text>
                <TouchableOpacity onPress={handleConfirm}>
                    <Text className="text-brand-600 font-bold text-lg">Done</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-1 bg-gray-50 p-4">
                <View className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <SignatureScreen
                        ref={ref}
                        onOK={handleOK}
                        webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                    />
                </View>
                <Text className="text-center text-gray-400 mt-2 text-xs">Please sign within the box above</Text>

                <TouchableOpacity
                    onPress={handleClear}
                    className="self-center mt-4 bg-gray-200 px-6 py-2 rounded-full"
                >
                    <Text className="text-gray-600 font-medium">Clear Signature</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default SignatureCaptureScreen;
