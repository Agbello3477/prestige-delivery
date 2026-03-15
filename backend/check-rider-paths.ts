import prisma from './src/lib/prisma';

async function main() {
    console.log('Fetching riders...');
    const riders = await prisma.user.findMany({
        where: { role: 'RIDER' },
        select: {
            id: true,
            name: true,
            passportUrl: true,
            ninSlipUrl: true
        }
    });

    console.log('Riders File Paths:');
    console.log(JSON.stringify(riders, null, 2));
}

main()
    .catch(e => {
        console.error('Script failed:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
