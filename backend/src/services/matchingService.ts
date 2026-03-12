import { User, Vehicle, Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { calculateDistance, isWithinKano, Point } from '../utils/geo';

export const findNearbyRiders = async (pickupLocation: Point) => {
    // 1. Check if pickup is within Kano (Phase 1 constraint)
    if (!isWithinKano(pickupLocation)) {
        throw new Error('Service is currently restricted to Kano State.');
    }

    // 2. Fetch all active riders (in a real app, we'd query by PostGIS or similar)
    // For now, we fetch all riders and filter in memory (not scalable but okay for MVP/Phase 1 with small rider base)
    const riders = await prisma.user.findMany({
        where: {
            role: Role.RIDER,
            isVerified: true,
            isBlocked: false,
            isSuspended: false
            // In a real app, we would check 'isOnline' status here
        },
        include: {
            vehicles: true,
        },
    });

    // 3. Filter riders by distance
    // Mocking rider location - in reality, this would come from a tracking table or Redis cache
    // For this implementation, we will assume riders have a 'lastKnownLocation' field (which we need to add to User or TrackingLog)
    // prioritizing simplicity for now, let's assume we find riders who have RECENT tracking logs

    // This is a placeholder logic as we need TrackingLog data
    return riders;
};
