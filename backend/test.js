const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://admin:securepassword@localhost:5434/prestige_logistics?schema=public' });
async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, "passportUrl", "ninSlipUrl" FROM "User" WHERE role=\'RIDER\' ORDER BY "createdAt" DESC LIMIT 1;');
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
run();
