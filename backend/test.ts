import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const riders = await prisma.user.findMany({
        where: { role: 'RIDER' },
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    console.log(riders);
}
main().finally(() => prisma.$disconnect());
