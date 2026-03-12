import app from './app';
import dotenv from 'dotenv';
import prisma from './lib/prisma';
import { createServer } from 'http';
import { initSocket } from './socket';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function main() {
    // Check database connection
    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }

    const httpServer = createServer(app);
    const io = initSocket(httpServer);

    httpServer.listen(PORT as number, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
