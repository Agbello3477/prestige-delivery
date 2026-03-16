const { Pool } = require('pg');

const connectionString = "postgresql://admin:securepassword@localhost:5434/prestige_logistics";

async function main() {
    const pool = new Pool({ connectionString });
    try {
        const res = await pool.query('SELECT name, email, "passportUrl", "ninSlipUrl" FROM "User" WHERE role = \'RIDER\'');
        console.log('--- RIDER IMAGES CHECK ---');
        res.rows.forEach(r => {
            console.log(`Rider: ${r.name} (${r.email})`);
            console.log(`  Passport: ${r.passportUrl || 'MISSING'}`);
            console.log(`  NIN Slip: ${r.ninSlipUrl || 'MISSING'}`);
            console.log('-------------------------');
        });
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

main();
