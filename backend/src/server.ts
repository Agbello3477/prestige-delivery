import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './lib/prisma';
import { createServer } from 'http';
import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;

async function main() {
    console.log('[STARTUP] Initializing Prestige Logistics API...');
    const httpServer = createServer(app);
    console.log('[STARTUP] HTTP server instance created.');
    
    const io = initSocket(httpServer);
    console.log('[STARTUP] Socket.io initialized.');

    httpServer.listen(PORT as number, '0.0.0.0', () => {
        console.log(`[STARTUP] Server successfully bound and listening on port ${PORT}`);
        console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    try {
        console.log('[STARTUP] Connecting to Prisma database...');
        await prisma.$connect();
        console.log('[STARTUP] Database connection established successfully.');
    } catch (error: any) {
        console.error('[ERROR] [STARTUP] Database connection failed:', error.message);
        console.error('[DATABASE_URL_CHECK]:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
