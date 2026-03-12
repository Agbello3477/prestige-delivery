import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

const API_KEY = 'AIzaSyBMQRMt57PLMW4UIS5-9q46YwhjdaXxw0I';
const KANO_CENTER = { lat: 12.0022, lng: 8.5920 };

const IntelligentMap = () => {
    // Mock Rider Locations
    const [riders, setRiders] = useState([
        { id: 1, name: 'Sani Abba', lat: 11.9900, lng: 8.5800, status: 'Active' },
        { id: 2, name: 'Musa Ibrahim', lat: 12.0100, lng: 8.6000, status: 'Idle' },
        { id: 3, name: 'Fatima Yusuf', lat: 11.9800, lng: 8.5500, status: 'Active' }
    ]);

    // Simulate movement
    useEffect(() => {
        const interval = setInterval(() => {
            setRiders(prevRiders => prevRiders.map(rider => ({
                ...rider,
                lat: rider.lat + (Math.random() - 0.5) * 0.001,
                lng: rider.lng + (Math.random() - 0.5) * 0.001
            })));
        }, 3000);
        return () => clearInterval(interval);
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
                    <Marker key={rider.id} position={{ lat: rider.lat, lng: rider.lng }} title={rider.name} />
                ))}
            </Map>
        </APIProvider>
    );
};

export default IntelligentMap;
