import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './lib/prisma';
import { createServer } from 'http';
import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;

async function main() {
    console.log('Starting application...');
    const httpServer = createServer(app);
    console.log('HTTP server created...');
    const io = initSocket(httpServer);
    console.log('Socket initialized...');

    httpServer.listen(PORT as number, '0.0.0.0', () => {
        console.log(`Server successfully bound and is running on port ${PORT}`);
    });

    try {
        await prisma.$connect();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
