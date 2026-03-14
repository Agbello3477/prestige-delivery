import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
}

const pool = new Pool({ 
    connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Render Postgres
    }
});

// Test connection first
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Connection test successful!');
        client.release();
    } catch (err: any) {
        console.error('❌ Database Connection Failed:', err.message);
        console.error('Hint: Make sure you copied the "External Database URL" from Render.');
        process.exit(1);
    }
}

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    await testConnection();
    // ... rest of the code ...
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
