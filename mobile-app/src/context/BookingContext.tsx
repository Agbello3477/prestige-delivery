
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface BookingContextType {
    pickupAddress: string;
    setPickupAddress: (address: string) => void;
    pickupLat: number | null;
    setPickupLat: (lat: number | null) => void;
    pickupLng: number | null;
    setPickupLng: (lng: number | null) => void;
    dropoffAddress: string;
    setDropoffAddress: (address: string) => void;
    dropoffLat: number | null;
    setDropoffLat: (lat: number | null) => void;
    dropoffLng: number | null;
    setDropoffLng: (lng: number | null) => void;
    vehicleType: string;
    setVehicleType: (type: string) => void;
    resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupLat, setPickupLat] = useState<number | null>(null);
    const [pickupLng, setPickupLng] = useState<number | null>(null);
    const [dropoffAddress, setDropoffAddress] = useState('');
    const [dropoffLat, setDropoffLat] = useState<number | null>(null);
    const [dropoffLng, setDropoffLng] = useState<number | null>(null);
    const [vehicleType, setVehicleType] = useState('bike');

    const resetBooking = () => {
        setPickupAddress('');
        setPickupLat(null);
        setPickupLng(null);
        setDropoffAddress('');
        setDropoffLat(null);
        setDropoffLng(null);
        setVehicleType('bike');
    };

    return (
        <BookingContext.Provider value={{
            pickupAddress, setPickupAddress,
            pickupLat, setPickupLat,
            pickupLng, setPickupLng,
            dropoffAddress, setDropoffAddress,
            dropoffLat, setDropoffLat,
            dropoffLng, setDropoffLng,
            vehicleType, setVehicleType,
            resetBooking
        }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};
