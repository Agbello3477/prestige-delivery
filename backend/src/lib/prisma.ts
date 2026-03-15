import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const isProduction = process.env.RENDER === 'true' || connectionString.includes('render.com');

const pool = new Pool({ 
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log(`[DEBUG] Prisma initialized via pg-adapter. SSL: ${isProduction}`);

export default prisma;
