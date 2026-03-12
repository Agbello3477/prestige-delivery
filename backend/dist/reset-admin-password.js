"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    try {
        const hashedPassword = await bcrypt_1.default.hash('admin123', 10);
        await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, 'admin@prestige.com']);
        console.log('Admin password aggressively reset to admin123');
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await pool.end();
    }
}
main();
