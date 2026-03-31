import request from 'supertest';
import app from '../index';

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'test123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'Amani School System API');
    });
  });
});
