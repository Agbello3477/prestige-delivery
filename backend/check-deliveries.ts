import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debugDeliveries() {
    try {
        const userId = 3; // Sinan (Rider)
        
        const deliveries = await prisma.delivery.findMany({
            where: {
                OR: [
                    { customerId: userId },
                    { riderId: userId }
                ]
            },
            orderBy: { updatedAt: 'desc' }
        });
        
        console.log('--- RIDER DELIVERIES ---');
        console.log(JSON.stringify(deliveries.map(d => ({
            id: d.id,
            tracking: d.trackingNumber,
            status: d.status,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        })), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

debugDeliveries();
