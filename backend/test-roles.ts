import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const allUsers = await prisma.user.findMany({ select: { email: true, role: true }});
  console.log("All users in DB:", allUsers);
}
main().catch(console.error).finally(() => prisma.$disconnect());
