import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

console.log(`[DEBUG] Prisma initialized using standard client.`);

export default prisma;
