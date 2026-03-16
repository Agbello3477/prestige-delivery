import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import prisma from './lib/prisma';

import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "*"],
        },
    },
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
import authRoutes from './routes/authRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import partnerRoutes from './routes/partnerRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import statsRoutes from './routes/statsRoutes';
import auditRoutes from './routes/auditRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                passportUrl: true,
                ninSlipUrl: true,
                createdAt: true
            }
        });
        
        const configStatus = {
            hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
            hasApiKey: !!process.env.CLOUDINARY_API_KEY,
            hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
            nodeEnv: process.env.NODE_ENV
        };

        res.json({ users, configStatus });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/debug/uploads', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir);
        res.json({ 
            uploadsDir, 
            cwd: process.cwd(), 
            files,
            count: files.length
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Prestige Logistics API is running' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Prestige Logistics API is running' });
});

export default app;
