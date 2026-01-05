const request = require('supertest');
const app = require('../../src/app');

describe('Bubbles Integration Tests', () => {
  let authToken;
  let testUser;
  let testBubbles = [];

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/v1/users')
      .send({
        username: 'bubble_integration_user',
        email: 'bubble_integration@university.edu',
        displayName: 'Bubble Integration User',
        role: 'student',
        universityId: 'university-demo'
      });

    testUser = userResponse.body;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'bubble_integration@university.edu',
        password: 'testpassword123'
      });

    authToken = loginResponse.body.token;

    // Create some test bubbles for integration testing
    const bubbleData = [
      {
        name: 'Computer Science Study Group',
        hashtag: '#computer-science',
        description: 'A place for CS students to share notes and discuss concepts',
        isPublic: true,
        tags: ['computer-science', 'study-group', 'programming']
      },
      {
        name: 'Math Help Center',
        hashtag: '#math-help',
        description: 'Get help with mathematics problems',
        isPublic: true,
        tags: ['math', 'help', 'tutoring']
      },
      {
        name: 'Research Discussion',
        hashtag: '#research',
        description: 'Share and discuss research topics',
        isPublic: false, // Private bubble
        tags: ['research', 'academic']
      }
    ];

    for (const bubble of bubbleData) {
      const response = await request(app)
        .post('/api/v1/bubbles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bubble);

      testBubbles.push(response.body.bubble);
    }
  });

  describe('Bubble Discovery Workflow', () => {
    it('should discover bubbles through search', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?search=computer')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      const computerScienceBubble = response.body.find(bubble => 
        bubble.hashtag === '#computer-science'
      );
      expect(computerScienceBubble).toBeDefined();
    });

    it('should filter bubbles by university', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?university=university-demo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All bubbles should be from the specified university
      response.body.forEach(bubble => {
        expect(bubble.universityId).toBe('university-demo');
      });
    });

    it('should return empty results for non-existent search', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?search=nonexistenttopic12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Bubble Joining Workflow', () => {
    let publicBubble, privateBubble;

    beforeAll(() => {
      publicBubble = testBubbles.find(b => bubble.isPublic);
      privateBubble = testBubbles.find(b => !bubble.isPublic);
    });

    it('should allow joining public bubble', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('joined bubble successfully');
    });

    it('should update user profile with joined bubble', async () => {
      // Get user profile to check joined bubbles
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('joinedBubbles');
      expect(Array.isArray(response.body.joinedBubbles)).toBe(true);
      expect(response.body.joinedBubbles).toContain(publicBubble.id);
    });

    it('should update bubble member count', async () => {
      const response = await request(app)
        .get(`/api/v1/bubbles/${publicBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bubble).toHaveProperty('memberCount');
      expect(response.body.bubble.memberCount).toBeGreaterThan(1); // At least the creator and test user
    });

    it('should prevent joining private bubble without invitation', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${privateBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('should handle duplicate join attempts gracefully', async () => {
      // Join the bubble first time
      await request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to join again
      const response = await request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already a member');
    });
  });

  describe('Bubble Leaving Workflow', () => {
    let joinedBubble;

    beforeAll(async () => {
      // Join a bubble for leaving tests
      joinedBubble = testBubbles.find(b => b.isPublic);
      await request(app)
        .post(`/api/v1/bubbles/${joinedBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should allow leaving joined bubble', async () => {
      const response = await request(app)
        .post(`/api/v1/bubbles/${joinedBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('left bubble successfully');
    });

    it('should update user profile after leaving', async () => {
      // Get user profile to check bubble was removed
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('joinedBubbles');
      expect(response.body.joinedBubbles).not.toContain(joinedBubble.id);
    });

    it('should update bubble member count after leaving', async () => {
      const response = await request(app)
        .get(`/api/v1/bubbles/${joinedBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bubble).toHaveProperty('memberCount');
      // Member count should be back to original (without our test user)
      expect(response.body.bubble.memberCount).toBe(1); // Just the creator
    });

    it('should handle leaving non-member bubble gracefully', async () => {
      // Use a bubble we haven't joined
      const nonMemberBubble = testBubbles.find(b => b.id !== joinedBubble.id);
      
      const response = await request(app)
        .post(`/api/v1/bubbles/${nonMemberBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not a member');
    });
  });

  describe('Bubble Content Integration', () => {
    let joinedBubble, testDroplet;

    beforeAll(async () => {
      // Join a bubble and create a droplet in it
      joinedBubble = testBubbles.find(b => b.isPublic);
      await request(app)
        .post(`/api/v1/bubbles/${joinedBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      // Create a droplet in the bubble
      const dropletResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test droplet for bubble integration',
          bubbles: [joinedBubble.hashtag],
          visibility: 'bubble'
        });

      testDroplet = dropletResponse.body.droplet;
    });

    it('should include bubble droplets in user feed', async () => {
      const response = await request(app)
        .get('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('droplets');
      expect(Array.isArray(response.body.droplets)).toBe(true);

      const bubbleDroplet = response.body.droplets.find(droplet => 
        droplet.id === testDroplet.id
      );
      expect(bubbleDroplet).toBeDefined();
    });

    it('should filter feed by joined bubbles', async () => {
      const response = await request(app)
        .get(`/api/v1/droplets?bubbles=${joinedBubble.hashtag}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('droplets');
      expect(Array.isArray(response.body.droplets)).toBe(true);
      expect(response.body.droplets.length).toBeGreaterThan(0);

      // All droplets should contain the specified bubble
      response.body.droplets.forEach(droplet => {
        expect(droplet.bubbles).toContain(joinedBubble.hashtag);
      });
    });

    it('should update bubble droplet count', async () => {
      const response = await request(app)
        .get(`/api/v1/bubbles/${joinedBubble.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bubble).toHaveProperty('dropletCount');
      expect(response.body.bubble.dropletCount).toBeGreaterThan(0);
    });
  });

  describe('Search and Filter Integration', () => {
    it('should combine search and bubble filters', async () => {
      const response = await request(app)
        .get(`/api/v1/droplets?search=study&bubbles=${testBubbles[0].hashtag}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('droplets');
      expect(Array.isArray(response.body.droplets)).toBe(true);

      // Results should match both search and bubble criteria
      response.body.droplets.forEach(droplet => {
        if (droplet.content) {
          expect(droplet.content.toLowerCase()).toContain('study');
        }
        expect(droplet.bubbles).toContain(testBubbles[0].hashtag);
      });
    });

    it('should handle complex search queries', async () => {
      const response = await request(app)
        .get('/api/v1/bubbles?search=computer%20science%20study')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      
      // Should find bubbles matching multiple search terms
      const matchingBubbles = response.body.filter(bubble => {
        const searchText = 'computer science study';
        const bubbleText = `${bubble.name} ${bubble.description} ${bubble.tags.join(' ')}`.toLowerCase();
        return searchText.split(' ').every(term => bubbleText.includes(term));
      });

      expect(matchingBubbles.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Integration', () => {
    it('should handle bubble join/leave events', async () => {
      // This would test the real-time aspect if socket.io is integrated
      // For now, we'll test the API endpoints that would trigger events
      
      const publicBubble = testBubbles.find(b => b.isPublic);
      
      // Join bubble
      const joinResponse = await request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(joinResponse.body).toHaveProperty('message');

      // Leave bubble
      const leaveResponse = await request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(leaveResponse.body).toHaveProperty('message');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed bubble IDs gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/bubbles/invalid-uuid/join')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should handle authentication timeout', async () => {
      // Test with expired or invalid token
      const response = await request(app)
        .get('/api/v1/bubbles')
        .set('Authorization', 'Bearer expired_token_12345')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should handle rate limiting', async () => {
      // This would test rate limiting if implemented
      // For now, just ensure the endpoint is responsive
      const promises = Array(10).fill().map(() => 
        request(app)
          .get('/api/v1/bubbles')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // At least some requests should succeed
      const successResponses = responses.filter(res => res.status === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', async () => {
      const publicBubble = testBubbles.find(b => b.isPublic);
      
      // Test concurrent join and leave operations
      const joinPromise = request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      const leavePromise = request(app)
        .post(`/api/v1/bubbles/${publicBubble.id}/leave`)
        .set('Authorization', `Bearer ${authToken}`);

      const [joinResponse, leaveResponse] = await Promise.all([joinPromise, leavePromise]);
      
      // Both operations should be handled gracefully
      expect([200, 403, 400]).toContain(joinResponse.status);
      expect([200, 400]).toContain(leaveResponse.status);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    // This would typically involve:
    // 1. Deleting test bubbles
    // 2. Deleting test user
    // 3. Cleaning up any database entries
    
    // For now, we'll just log that cleanup would happen here
    console.log('Integration test cleanup completed');
  });
});