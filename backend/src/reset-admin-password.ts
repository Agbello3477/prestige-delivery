import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE "User" SET password = $1 WHERE email = $2', [hashedPassword, 'admin@prestige.com']);
        console.log('Admin password aggressively reset to admin123');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
