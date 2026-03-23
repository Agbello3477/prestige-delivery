import prisma from './src/lib/prisma';
import { DeliveryStatus } from '@prisma/client';

async function main() {
    console.log('--- VENDOR ORDERS CHECK ---');
    const orders = await prisma.vendorOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            partner: { select: { businessName: true } }
        }
    });

    console.log(`Found ${orders.length} recent orders.`);
    orders.forEach(o => {
        console.log(`- Order #${o.id} | Partner: ${o.partner?.businessName} | Status: ${o.status} | Total: ${o.totalAmount} | Option: ${o.deliveryOption} | Created: ${o.createdAt}`);
    });

    console.log('\n--- PARTNER PROFILES CHECK ---');
    const partners = await prisma.partnerProfile.findMany({
        take: 10,
        select: { id: true, businessName: true, userId: true }
    });
    partners.forEach(p => console.log(`- Partner ID: ${p.id} | Name: ${p.businessName} | User ID: ${p.userId}`));

    console.log('\n--- RECENT DELIVERIES (FOR HISTORY CHECK) ---');
    const deliveries = await prisma.delivery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            customer: { select: { name: true } }
        }
    });
    deliveries.forEach(d => console.log(`- Delivery ID: ${d.id} | Customer: ${d.customer?.name} | Status: ${d.status} | Note: ${d.deliveryNote}`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
