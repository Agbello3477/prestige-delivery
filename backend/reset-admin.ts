import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function reset() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { email: 'admin@prestigedelivery.com' },
            data: { password: hashedPassword }
        });
        console.log('Successfully reset Admin password to: admin123');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

reset();
