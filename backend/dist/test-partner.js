"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:4000/api';
async function main() {
    try {
        // 1. Login as Admin
        const loginRes = await axios_1.default.post(`${API_URL}/auth/login`, {
            email: 'admin@prestige.com',
            password: 'securepassword'
        });
        const token = loginRes.data.token;
        console.log('Admin Logged In');
        // 2. Create Partner
        try {
            const partnerRes = await axios_1.default.post(`${API_URL}/partners`, {
                name: 'Test Partner Logistics',
                email: 'partner@test.com',
                password: 'password123',
                phone: '08012345678'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Partner Created:', partnerRes.data);
        }
        catch (err) {
            if (err.response?.status === 400 && err.response?.data?.message === 'User already exists') {
                console.log('Partner already exists, skipping creation.');
            }
            else {
                throw err;
            }
        }
        // 3. List Partners
        const listRes = await axios_1.default.get(`${API_URL}/partners`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Partners List:', listRes.data);
    }
    catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}
main();
