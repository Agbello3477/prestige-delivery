"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinKano = exports.calculateDistance = void 0;
// Kano State Coordinates (Approximate Center)
const KANO_CENTER = { lat: 11.9964, lng: 8.5167 };
const KANO_RADIUS_KM = 50; // Example radius for "Kano State" coverage area
// Haversine formula to calculate distance in km
const calculateDistance = (p1, p2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(p2.lat - p1.lat);
    const dLng = deg2rad(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(p1.lat)) *
            Math.cos(deg2rad(p2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};
exports.calculateDistance = calculateDistance;
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};
const isWithinKano = (point) => {
    const distance = (0, exports.calculateDistance)(point, KANO_CENTER);
    return distance <= KANO_RADIUS_KM;
};
exports.isWithinKano = isWithinKano;
