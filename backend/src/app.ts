import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Prestige Logistics API is running' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Prestige Logistics API is running' });
});

export default app;
