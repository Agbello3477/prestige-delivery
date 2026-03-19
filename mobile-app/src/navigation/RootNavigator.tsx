import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import WelcomeHomeScreen from '../screens/WelcomeHomeScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import RiderDashboardScreen from '../screens/RiderDashboardScreen';
import BookingScreen from '../screens/BookingScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import SignatureCaptureScreen from '../screens/SignatureScreen';
import RecordProofScreen from '../screens/RecordProofScreen';
import CallScreen from '../screens/CallScreen';
import VendorListScreen from '../screens/VendorListScreen';
import VendorMenuScreen from '../screens/VendorMenuScreen';
import PharmacyPrescriptionUploadScreen from '../screens/PharmacyPrescriptionUploadScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#0284c7" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                user.role === 'RIDER' ? (
                    <>
                        <Stack.Screen name="RiderDashboard" component={RiderDashboardScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="SignatureCapture" component={SignatureCaptureScreen} />
                        <Stack.Screen name="RecordProof" component={RecordProofScreen} />
                        <Stack.Screen name="Call" component={CallScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="WelcomeHome" component={WelcomeHomeScreen} />
                        <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
                        <Stack.Screen name="Booking" component={BookingScreen} />
                        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="Call" component={CallScreen} />
                        <Stack.Screen name="VendorList" component={VendorListScreen} />
                        <Stack.Screen name="VendorMenu" component={VendorMenuScreen} />
                        <Stack.Screen name="PharmacyPrescriptionUpload" component={PharmacyPrescriptionUploadScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    </>
                )
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;
