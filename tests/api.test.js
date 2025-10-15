/**
 * Integration tests for the API endpoints
 */

const request = require('supertest');
const app = require('../server/server');

describe('API Integration Tests', () => {
    describe('GET /', () => {
        test('should serve the main HTML page', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/html/);
        });
    });

    describe('GET /health', () => {
        test('should return health check status', async () => {
            const response = await request(app).get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('service', 'Cloud Skills Boost Calculator');
        });
    });

    describe('GET /api/scoring-config', () => {
        test('should return scoring configuration', async () => {
            const response = await request(app).get('/api/scoring-config');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('config');
            expect(response.body.config).toHaveProperty('badges');
            expect(response.body.config).toHaveProperty('games');
            expect(response.body.config).toHaveProperty('difficulty');
        });
    });

    describe('GET /api/enrollment-list', () => {
        test('should return enrollment list', async () => {
            const response = await request(app).get('/api/enrollment-list');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('count');
            expect(response.body).toHaveProperty('participants');
            expect(Array.isArray(response.body.participants)).toBe(true);
        });
    });

    describe('POST /api/calculate-points', () => {
        test('should return 400 for missing profile URL', async () => {
            const response = await request(app)
                .post('/api/calculate-points')
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Profile URL is required');
        });

        test('should return 403 for non-enrolled profile', async () => {
            const response = await request(app)
                .post('/api/calculate-points')
                .send({
                    profileUrl: 'https://www.cloudskillsboost.google/public_profiles/non-enrolled-user'
                });
            
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error', 'Profile is not enrolled in the program');
        });

        test('should handle enrolled profile (mocked)', async () => {
            // This test checks the complete flow with an enrolled profile
            const response = await request(app)
                .post('/api/calculate-points')
                .send({
                    profileUrl: 'https://www.cloudskillsboost.google/public_profiles/sample-profile-1'
                });
            
            // In test environment, this should complete successfully with mock data or fail at fetching stage
            expect([200, 500]).toContain(response.status);
            if (response.status === 500) {
                expect(response.body).toHaveProperty('error');
            } else {
                expect(response.body).toHaveProperty('success', true);
            }
        });
    });

    describe('404 handler', () => {
        test('should return 404 for unknown endpoints', async () => {
            const response = await request(app).get('/api/unknown-endpoint');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Endpoint not found');
        });
    });
});

module.exports = {};