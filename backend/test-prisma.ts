import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const riders = await prisma.user.findMany({ where: { role: 'RIDER' }, include: { vehicles: true } });
  console.log(JSON.stringify(riders, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
