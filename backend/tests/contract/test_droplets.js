const request = require('supertest');
const { app } = require('../../src/app');

describe('Droplets API Contract Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/v1/users')
      .send({
        username: 'testuser',
        email: 'test@university.edu',
        password: 'testpassword123',
        displayName: 'Test User',
        role: 'student',
        universityId: 'test-university'
      });

    expect(userResponse.status).toBe(201);
    testUser = userResponse.body;

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@university.edu',
        password: 'testpassword123'
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.token;
  });

  describe('POST /api/v1/droplets', () => {
    it('should create a droplet with valid data', async () => {
      const dropletData = {
        content: 'Hello, university! This is my first droplet. #introduction',
        bubbles: ['introduction'],
        visibility: 'university'
      };

      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        content: dropletData.content,
        authorId: testUser.id,
        visibility: dropletData.visibility,
        bubbles: dropletData.bubbles,
        createdAt: expect.any(String)
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/droplets')
        .send({
          content: 'Test droplet without auth'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_MISSING');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.stringContaining('required')
          })
        ])
      );
    });

    it('should validate content length', async () => {
      const longContent = 'a'.repeat(5001);
      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'content',
            message: expect.stringContaining('5000')
          })
        ])
      );
    });

    it('should validate visibility options', async () => {
      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test droplet',
          visibility: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should limit bubble count', async () => {
      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test droplet',
          bubbles: ['bubble1', 'bubble2', 'bubble3', 'bubble4', 'bubble5', 'bubble6']
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should handle media attachments', async () => {
      const response = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Droplet with media',
          visibility: 'university'
        });

      // Will be enhanced when media upload is implemented
      expect(response.status).toBe(501); // Not implemented yet
    });
  });

  describe('GET /api/v1/droplets', () => {
    it('should return paginated droplets for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(501); // Not implemented yet
    });

    it('should require authentication for personalized feed', async () => {
      const response = await request(app)
        .get('/api/v1/droplets')
        .query({ limit: 10 });

      expect(response.status).toBe(401);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 101, offset: -1 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_PAGINATION');
    });
  });

  describe('GET /api/v1/droplets/:dropletId', () => {
    it('should return droplet by ID', async () => {
      // First create a droplet
      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test droplet for retrieval',
          visibility: 'university'
        });

      expect(createResponse.status).toBe(201);
      const dropletId = createResponse.body.id;

      // Retrieve the droplet
      const getResponse = await request(app)
        .get(`/api/v1/droplets/${dropletId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(501); // Not implemented yet
    });

    it('should validate droplet ID format', async () => {
      const response = await request(app)
        .get('/api/v1/droplets/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should allow access without authentication for public droplets', async () => {
      // This will be implemented later
      const response = await request(app)
        .get('/api/v1/droplets/some-uuid');

      expect(response.status).toBe(501); // Not implemented yet
    });
  });

  describe('DELETE /api/v1/droplets/:dropletId', () => {
    it('should allow author to delete their droplet', async () => {
      // Create a droplet first
      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test droplet for deletion',
          visibility: 'university'
        });

      expect(createResponse.status).toBe(201);
      const dropletId = createResponse.body.id;

      // Delete the droplet
      const deleteResponse = await request(app)
        .delete(`/api/v1/droplets/${dropletId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(501); // Not implemented yet
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/droplets/some-uuid');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/droplets/:dropletId/interact', () => {
    it('should handle upvote interaction', async () => {
      // This will be implemented in User Story 4
      const response = await request(app)
        .post('/api/v1/droplets/some-uuid/interact')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'upvote'
        });

      expect(response.status).toBe(501); // Not implemented yet
    });

    it('should validate interaction type', async () => {
      const response = await request(app)
        .post('/api/v1/droplets/some-uuid/interact')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'invalid_interaction'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require badge details for badge interactions', async () => {
      const response = await request(app)
        .post('/api/v1/droplets/some-uuid/interact')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'badge',
          badgeType: 'helpful'
          // missing reason
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });
});

afterAll(async () => {
  // Cleanup test data if needed
});