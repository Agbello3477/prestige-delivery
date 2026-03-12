"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    try {
        console.log('Connecting...');
        const user = await prisma.user.findUnique({
            where: { email: 'test@example.com' },
        });
        console.log('User found:', user);
    }
    catch (error) {
        console.error('DB Error:', error);
    }
    finally {
        await prisma.$disconnect();
        await pool.end();
    }
}
main();
