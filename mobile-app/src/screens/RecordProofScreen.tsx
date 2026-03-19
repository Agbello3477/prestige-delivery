import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordProofScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isCapturing, setIsCapturing] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { onProofRecorded } = route.params || {};

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && !isCapturing) {
            setIsCapturing(true);
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.7,
                    base64: false,
                });
                setIsCapturing(false);
                if (photo?.uri) {
                    Alert.alert(
                        "Photo Captured",
                        "Do you want to use this photo as proof?",
                        [
                            { text: "Retake", onPress: () => { } },
                            {
                                text: "Use Photo",
                                onPress: () => {
                                    if (onProofRecorded) onProofRecorded(photo.uri);
                                    navigation.goBack();
                                }
                            }
                        ]
                    );
                }
            } catch (error) {
                console.error(error);
                setIsCapturing(false);
                Alert.alert("Error", "Failed to take picture");
            }
        }
    };

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
                mode="picture"
            >
                <SafeAreaView style={styles.uiContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="self-start bg-black/50 p-2 rounded-full m-4"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            onPress={toggleCameraFacing}
                            className="bg-black/50 p-3 rounded-full mr-10 self-center"
                        >
                            <Ionicons name="camera-reverse" size={28} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={takePicture}
                            style={styles.captureButton}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </CameraView>
            {isCapturing && (
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    <ActivityIndicator size="large" color="white" />
                    <Text className="text-white font-bold mt-2">Capturing...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'black'
    },
    camera: {
        flex: 1,
    },
    uiContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
        borderColor: 'white',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
    }
});
