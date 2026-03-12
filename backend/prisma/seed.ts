import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

async function main() {
    // 1. Create Kano State
    const kano = await prisma.state.upsert({
        where: { name: 'Kano' },
        update: {},
        create: {
            name: 'Kano',
            isActive: true,
            geofence: {
                center: { lat: 11.9964, lng: 8.5167 },
                radiusKm: 50
            }
        },
    });

    console.log({ kano });

    // 2. Create Default Admin
    const adminPassword = await hashPassword('admin123');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@prestige.com' },
        update: {},
        create: {
            email: 'admin@prestige.com',
            name: 'System Admin',
            password: adminPassword,
            role: Role.ADMIN,
            phone: '0000000000',
        },
    });

    console.log({ admin });

    // 3. Create Pricing Module for Kano
    // Check if it already exists
    const existingPricing = await prisma.pricingModule.findFirst({
        where: { stateId: kano.id }
    });

    if (!existingPricing) {
        const kanoPricing = await prisma.pricingModule.create({
            data: {
                stateId: kano.id,
                baseFare: 500, // Naira
                perKmRate: 100, // Naira
            }
        });
        console.log({ kanoPricing });
    } else {
        console.log({ kanoPricing: existingPricing });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
