const request = require('supertest');
const app = require('../../src/app');

describe('Bubbles API Contract Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/v1/users')
      .send({
        username: 'bubble_test_user',
        email: 'bubble_test@university.edu',
        displayName: 'Bubble Test User',
        role: 'student',
        universityId: 'university-demo'
      });

    testUser = userResponse.body;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bubble_test@university.edu',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/v1/bubbles', () => {
    it('should return list of bubbles when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Each bubble should have required fields
      if (response.body.length > 0) {
        response.body.forEach(bubble => {
          expect(bubble).toHaveProperty('id');
          expect(bubble).toHaveProperty('name');
          expect(bubble).toHaveProperty('hashtag');
          expect(bubble).toHaveProperty('description');
          expect(bubble).toHaveProperty('creatorId');
          expect(bubble).toHaveProperty('memberCount');
          expect(bubble).toHaveProperty('dropletCount');
          expect(bubble).toHaveProperty('isPublic');
          expect(bubble).toHaveProperty('createdAt');
          expect(bubble).toHaveProperty('updatedAt');
        });
      }
    });

    it('should support search parameter', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?search=computer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // Search results should contain bubbles matching search term
      if (response.body.length > 0) {
        response.body.forEach(bubble => {
          expect(
            bubble.name.toLowerCase().includes('computer') ||
            bubble.hashtag.toLowerCase().includes('computer') ||
            (bubble.description && bubble.description.toLowerCase().includes('computer'))
          ).toBe(true);
        });
      }
    });

    it('should support university parameter', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?university=university-demo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // Results should be from specified university
      if (response.body.length > 0) {
        response.body.forEach(bubble => {
          expect(bubble.universityId).toBe('university-demo');
        });
      }
    });

    it('should handle empty search gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?search=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/bubbles', () => {
    it('should create a new bubble when authenticated', async () => {
      const bubbleData = {
        name: 'Computer Science Study Group',
        hashtag: '#computer-science',
        description: 'A place for CS students to share notes and discuss concepts',
        isPublic: true,
        tags: ['computer-science', 'study-group', 'programming']
      };

      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bubbleData)
        .expect(201);

      expect(response.body).toHaveProperty('bubble');
      expect(response.body.bubble).toHaveProperty('id');
      expect(response.body.bubble.name).toBe(bubbleData.name);
      expect(response.body.bubble.hashtag).toBe(bubbleData.hashtag);
      expect(response.body.bubble.description).toBe(bubbleData.description);
      expect(response.body.bubble.isPublic).toBe(bubbleData.isPublic);
      expect(response.body.bubble.creatorId).toBe(testUser.id);
      expect(response.body.bubble.memberCount).toBe(1); // Creator is automatically a member
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing required fields'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body).toHaveProperty('details');
    });

    it('should validate hashtag format', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bubble',
          hashtag: 'invalid-hashtag', // Missing # symbol
          description: 'Test description'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      
      const hashtagError = response.body.details.find(detail => 
        detail.field === 'hashtag'
      );
      expect(hashtagError).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .send({
          name: 'Test Bubble',
          hashtag: '#test',
          description: 'Test'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/bubbles/:bubbleId', () => {
    let testBubble;

    beforeAll(async () => {
      // Create a test bubble for these tests
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Get Test Bubble',
          hashtag: '#get-test',
          description: 'A bubble for testing GET endpoint'
        });

      testBubble = response.body.bubble;
    });

    it('should return bubble details when authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('bubble');
      expect(response.body.bubble.id).toBe(testBubble.id);
      expect(response.body.bubble.name).toBe(testBubble.name);
      expect(response.body.bubble.hashtag).toBe(testBubble.hashtag);
      expect(response.body.bubble.description).toBe(testBubble.description);
      expect(response.body.bubble).toHaveProperty('creator');
      expect(response.body.bubble).toHaveProperty('members');
      expect(response.body.bubble).toHaveProperty('recentDroplets');
    });

    it('should return 404 for non-existent bubble', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/bubbles/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/bubbles/:bubbleId/join', () => {
    let testBubble;

    beforeAll(async () => {
      // Create a test bubble for joining tests
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Join Test Bubble',
          hashtag: '#join-test',
          description: 'A bubble for testing joining'
        });

      testBubble = response.body.bubble;
    });

    it('should allow user to join public bubble', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('joined bubble successfully');
    });

    it('should increment member count when joining', async () => {
      // Get initial member count
      const initialResponse = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialCount = initialResponse.body.bubble.memberCount;

      // Join the bubble
      await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check updated member count
      const updatedResponse = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedResponse.body.bubble.memberCount).toBe(initialCount + 1);
    });

    it('should return 404 for non-existent bubble', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post(`/api/v1/bubbles/${fakeId}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/join`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/bubbles/:bubbleId/leave', () => {
    let testBubble;

    beforeAll(async () => {
      // Create and join a test bubble for leaving tests
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Leave Test Bubble',
          hashtag: '#leave-test',
          description: 'A bubble for testing leaving'
        });

      testBubble = response.body.bubble;

      // Join the bubble first
      await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should allow user to leave bubble', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('left bubble successfully');
    });

    it('should decrement member count when leaving', async () => {
      // Get initial member count
      const initialResponse = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialCount = initialResponse.body.bubble.memberCount;

      // Leave the bubble
      await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check updated member count
      const updatedResponse = await request(app)
        .get(`/api/v1/bubbles/${testBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedResponse.body.bubble.memberCount).toBe(initialCount - 1);
    });

    it('should return 404 for non-existent bubble', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .post(`/api/v1/bubbles/${fakeId}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${testBubble.id}/leave`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Data Validation', () => {
    it('should validate bubble name length', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A'.repeat(100), // Too long (max is 50)
          hashtag: '#test',
          description: 'Test'
        })
        .expect(400);

      const nameError = response.body.details.find(detail => 
        detail.field === 'name'
      );
      expect(nameError).toBeDefined();
    });

    it('should validate hashtag length', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bubble',
          hashtag: '#'.repeat(25) + 'toolong', // Too long
          description: 'Test'
        })
        .expect(400);

      const hashtagError = response.body.details.find(detail => 
        detail.field === 'hashtag'
      );
      expect(hashtagError).toBeDefined();
    });

    it('should validate description length', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bubble',
          hashtag: '#test',
          description: 'A'.repeat(600) // Too long (max is 500)
        })
        .expect(400);

      const descriptionError = response.body.details.find(detail => 
        detail.field === 'description'
      );
      expect(descriptionError).toBeDefined();
    });

    it('should validate tag count limits', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Bubble',
          hashtag: '#test',
          description: 'Test bubble with many tags',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10', 'tag11'] // Too many (max is 10)
        })
        .expect(400);

      const tagsError = response.body.details.find(detail => 
        detail.field === 'tags'
      );
      expect(tagsError).toBeDefined();
    });
  });

  afterAll(async () => {
    // Cleanup test data if needed
    // This would typically involve deleting the test user and any created bubbles
  });
});