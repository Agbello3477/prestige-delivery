import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Content Check ---');
  try {
    const userCount = await prisma.user.count();
    const riderCount = await prisma.user.count({ where: { role: 'RIDER' } });
    const customerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const deliveryCount = await prisma.delivery.count();
    
    console.log(`Total Users: ${userCount}`);
    console.log(`Riders: ${riderCount}`);
    console.log(`Customers: ${customerCount}`);
    console.log(`Admins: ${adminCount}`);
    console.log(`Deliveries: ${deliveryCount}`);
    
    if (userCount > 0) {
      const latestUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, name: true }
      });
      console.log('\nLatest 5 Users:');
      console.table(latestUsers);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
