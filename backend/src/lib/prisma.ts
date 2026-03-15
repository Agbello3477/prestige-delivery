import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
// Render sets RENDER=true, but we also check for production strings and NODE_ENV
const isProduction = 
    process.env.RENDER === 'true' || 
    process.env.NODE_ENV === 'production' || 
    connectionString.includes('render.com') || 
    connectionString.includes('amazonaws.com');

console.log(`[DEBUG] Prisma initializing. Production mode: ${isProduction}`);

const pool = new Pool({ 
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
