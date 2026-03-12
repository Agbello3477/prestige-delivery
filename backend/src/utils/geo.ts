// Kano State Coordinates (Approximate Center)
const KANO_CENTER = { lat: 11.9964, lng: 8.5167 };
const KANO_RADIUS_KM = 50; // Example radius for "Kano State" coverage area

export interface Point {
    lat: number;
    lng: number;
}

// Haversine formula to calculate distance in km
export const calculateDistance = (p1: Point, p2: Point): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(p2.lat - p1.lat);
    const dLng = deg2rad(p2.lng - p1.lng);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(p1.lat)) *
        Math.cos(deg2rad(p2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const isWithinKano = (point: Point): boolean => {
    const distance = calculateDistance(point, KANO_CENTER);
    return distance <= KANO_RADIUS_KM;
};
