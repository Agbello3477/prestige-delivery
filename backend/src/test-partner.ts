
import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function main() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@prestige.com',
            password: 'securepassword'
        });
        const token = loginRes.data.token;
        console.log('Admin Logged In');

        // 2. Create Partner
        try {
            const partnerRes = await axios.post(`${API_URL}/partners`, {
                name: 'Test Partner Logistics',
                email: 'partner@test.com',
                password: 'password123',
                phone: '08012345678'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Partner Created:', partnerRes.data);
        } catch (err: any) {
            if (err.response?.status === 400 && err.response?.data?.message === 'User already exists') {
                console.log('Partner already exists, skipping creation.');
            } else {
                throw err;
            }
        }

        // 3. List Partners
        const listRes = await axios.get(`${API_URL}/partners`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Partners List:', listRes.data);

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
