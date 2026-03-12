
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('Connecting...');
        const user = await prisma.user.findUnique({
            where: { email: 'test@example.com' },
        });
        console.log('User found:', user);
    } catch (error) {
        console.error('DB Error:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
