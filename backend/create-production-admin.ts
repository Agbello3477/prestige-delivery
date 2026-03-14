import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // CHANGE THESE TO YOUR DESIRED CREDENTIALS
    const email = 'admin@prestige.com'; 
    const password = 'your_secure_password';
    const name = 'Admin User';

    console.log(`Checking for user: ${email}...`);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log('User found. Promoting to ADMIN...');
        await prisma.user.update({
            where: { email },
            data: { role: Role.ADMIN }
        });
        console.log('User promoted successfully!');
    } else {
        console.log('User not found. Creating new ADMIN user...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: Role.ADMIN,
                isVerified: true
            }
        });
        console.log('Admin user created successfully!');
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
