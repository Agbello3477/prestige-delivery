const { Pool } = require('pg');

const connectionString = "postgresql://admin:securepassword@localhost:5434/prestige_logistics";

async function main() {
    const pool = new Pool({ connectionString });
    try {
        const res = await pool.query('SELECT count(*) FROM "User"');
        console.log(`--- TOTAL USERS: ${res.rows[0].count} ---`);
        const users = await pool.query('SELECT name, email, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC');
        users.rows.forEach(u => console.log(`${u.name} | ${u.email} | ${u.role} | ${u.createdAt}`));
        res.rows.forEach(r => {
            console.log(`Action: ${r.action}`);
            console.log(`  Details: ${r.details}`);
            console.log(`  Timestamp: ${r.timestamp}`);
            console.log('-------------------------');
        });
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

main();
