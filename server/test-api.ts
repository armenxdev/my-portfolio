
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1';

async function testHealth() {
    try {
        const response = await axios.get(`${API_URL.replace('/v1', '')}/health`);
        console.log('Health Check:', response.status, response.data);
    } catch (error: any) {
        console.error('Health Check Failed:', error.response?.status, error.response?.data || error.message);
    }
}

async function testPublicPosts() {
    try {
        const response = await axios.get(`${API_URL}/posts`);
        console.log('Public Posts:', response.status, `Count: ${response.data.data?.length}`);
    } catch (error: any) {
        console.error('Public Posts Failed:', error.response?.status, error.response?.data || error.message);
    }
}

async function testContact() {
    try {
        const response = await axios.post(`${API_URL}/contact`, {
            firstname: 'Test',
            lastname: 'User',
            email: 'test@example.com',
            message: 'Hello from test-api.ts'
        });
        console.log('Contact API:', response.status, response.data);
    } catch (error: any) {
        console.error('Contact API Failed:', error.response?.status, error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('Starting API Audit...');
    await testHealth();
    await testPublicPosts();
    await testContact();
    console.log('Audit Finished.');
}

runTests();
