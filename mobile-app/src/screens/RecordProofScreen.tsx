import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordProofScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [isRecording, setIsRecording] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { onVideoRecorded } = route.params || {};

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

    const startRecording = async () => {
        if (cameraRef.current) {
            setIsRecording(true);
            try {
                const video = await cameraRef.current.recordAsync({
                    maxDuration: 10, // 10 seconds
                });
                setIsRecording(false);
                if (video?.uri) {
                    Alert.alert(
                        "Video Recorded",
                        "Do you want to use this video as proof?",
                        [
                            { text: "Retake", onPress: () => { } },
                            {
                                text: "Use Video",
                                onPress: () => {
                                    if (onVideoRecorded) onVideoRecorded(video.uri);
                                    navigation.goBack();
                                }
                            }
                        ]
                    );
                }
            } catch (error) {
                console.error(error);
                setIsRecording(false);
            }
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
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
                mode="video"
            >
                <SafeAreaView style={styles.uiContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            if (isRecording) stopRecording();
                            navigation.goBack();
                        }}
                        className="self-start bg-black/50 p-2 rounded-full m-4"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.controlsContainer}>
                        <TouchableOpacity
                            onPress={isRecording ? stopRecording : startRecording}
                            style={[
                                styles.recordButton,
                                isRecording ? styles.recording : {}
                            ]}
                        />
                    </View>
                </SafeAreaView>
            </CameraView>
            {isRecording && (
                <View className="absolute top-12 self-center bg-red-600 px-4 py-1 rounded-full mt-10">
                    <Text className="text-white font-bold animate-pulse">Recording...</Text>
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
        marginBottom: 40,
    },
    recordButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 5,
        borderColor: 'white',
        backgroundColor: 'red',
    },
    recording: {
        backgroundColor: 'white',
        width: 60,
        height: 60,
        borderRadius: 5,
        transform: [{ translateX: 5 }, { translateY: 5 }]
    }
});
