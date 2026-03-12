
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
    console.log('Seeding Mobile App Test Users...');

    const commonPassword = await hashPassword('password123');

    // 1. Create Customer
    const customer = await prisma.user.upsert({
        where: { email: 'customer@prestige.com' },
        update: {},
        create: {
            email: 'customer@prestige.com',
            name: 'Test Customer',
            password: commonPassword,
            role: Role.CUSTOMER,
            phone: '08011111111',
        },
    });
    console.log('Created Customer:', customer.email);

    // 2. Create Rider
    const rider = await prisma.user.upsert({
        where: { email: 'rider@prestige.com' },
        update: {},
        create: {
            email: 'rider@prestige.com',
            name: 'Test Rider',
            password: commonPassword,
            role: Role.RIDER,
            phone: '08022222222',
            isVerified: true, // Auto-verify for testing
            vehicles: {
                create: [
                    {
                        type: 'BIKE',
                        plateNumber: 'KNO-123-AB',
                    }
                ]
            }
        },
    });
    console.log('Created Rider:', rider.email);
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
