import { useState } from 'react';

// Mock implementation of the push notifications hook for Expo Go compatibility
export const usePushNotifications = () => {
    const [expoPushToken] = useState<string | undefined>(undefined);
    const [notification] = useState<any>(undefined);

    // Returning undefined gracefully handles the absence of the native module
    // without breaking runtime components referencing this hook.
    return { expoPushToken, notification };
};
