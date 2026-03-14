import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import api from '../services/api';

const API_KEY = 'AIzaSyBMQRMt57PLMW4UIS5-9q46YwhjdaXxw0I';
const KANO_CENTER = { lat: 12.0022, lng: 8.5920 };

interface RiderLocation {
    id: number;
    name: string;
    lastLat: number;
    lastLng: number;
    vehicles: { type: string; plateNumber: string }[];
}

const IntelligentMap = () => {
    const [riders, setRiders] = useState<RiderLocation[]>([]);

    // Fetch on mount and set up a slow poll (e.g., every 30s) instead of a fast interval
    useEffect(() => {
        let isMounted = true;
        
        const loadRiders = async () => {
            try {
                const response = await api.get('/users/online-riders');
                if (isMounted) setRiders(response.data);
            } catch (error) {
                console.error('Failed to fetch online riders:', error);
            }
        };

        loadRiders();
        const interval = setInterval(loadRiders, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <APIProvider apiKey={API_KEY}>
            <Map
                style={{ width: '100%', height: '100%', borderRadius: '0.5rem' }}
                defaultCenter={KANO_CENTER}
                defaultZoom={11}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {riders.map(rider => (
                    <Marker 
                        key={rider.id} 
                        position={{ lat: rider.lastLat, lng: rider.lastLng }} 
                        title={`${rider.name} (${rider.vehicles[0]?.plateNumber || 'No Plate'})`} 
                    />
                ))}
            </Map>
        </APIProvider>
    );
};

export default IntelligentMap;
