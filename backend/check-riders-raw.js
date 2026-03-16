const { Pool } = require('pg');

const connectionString = "postgresql://admin:securepassword@localhost:5434/prestige_logistics";

async function main() {
    const pool = new Pool({ connectionString });
    try {
        const res = await pool.query('SELECT name, email, role, "passportUrl", "ninSlipUrl", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10');
        console.log('--- RECENT USERS IMAGE STATUS ---');
        res.rows.forEach(u => {
            console.log(`${u.name} | ${u.email} | ${u.role} | ${u.createdAt}`);
            console.log(`  Passport: ${u.passportUrl || 'MISSING'}`);
            console.log(`  NIN Slip: ${u.ninSlipUrl || 'MISSING'}`);
            console.log('-------------------------');
        });
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
