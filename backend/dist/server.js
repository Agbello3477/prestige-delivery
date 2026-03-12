"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const http_1 = require("http");
const socket_1 = require("./socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
async function main() {
    // Check database connection
    try {
        await prisma_1.default.$connect();
        console.log('Database connected successfully');
    }
    catch (error) {
        console.error('Database connection failed', error);
        process.exit(1);
    }
    const httpServer = (0, http_1.createServer)(app_1.default);
    const io = (0, socket_1.initSocket)(httpServer);
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
