"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            ...helmet_1.default.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "*"],
        },
    },
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir, {
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
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs));
// Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/deliveryRoutes"));
const partnerRoutes_1 = __importDefault(require("./routes/partnerRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/deliveries', deliveryRoutes_1.default);
app.use('/api/partners', partnerRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/stats', statsRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Prestige Logistics API is running' });
});
app.get('/', (req, res) => {
    res.json({ message: 'Prestige Logistics API is running' });
});
exports.default = app;
