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
const isProduction = process.env.RENDER === 'true' || connectionString.includes('render.com');
const pool = new pg_1.Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
console.log(`[DEBUG] Prisma initialized via pg-adapter. SSL: ${isProduction}`);
exports.default = prisma;
