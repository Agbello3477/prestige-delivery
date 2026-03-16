import prisma from './src/lib/prisma';

async function main() {
    console.log('[DEBUG] Starting rider image check...');
    try {
        const riders = await prisma.user.findMany({
            where: { role: 'RIDER' },
            select: {
                id: true,
                email: true,
                name: true,
                passportUrl: true,
                ninSlipUrl: true
            }
        });

        console.log('--- RIDER IMAGES CHECK ---');
        if (riders.length === 0) {
            console.log('No riders found in database.');
        }
        riders.forEach(r => {
            console.log(`Rider: ${r.name} (${r.email})`);
            console.log(`  Passport: ${r.passportUrl || 'MISSING'}`);
            console.log(`  NIN Slip: ${r.ninSlipUrl || 'MISSING'}`);
            console.log('-------------------------');
        });
    } catch (err) {
        console.error('[ERROR] Failed to query riders:', err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        process.exit();
    });
