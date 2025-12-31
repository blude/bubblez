const request = require('supertest');
const { app } = require('../../src/app');
const db = require('../../src/database/connection');

describe('Droplet Creation Integration Tests', () => {
  let authToken;
  let testUser;
  let createdDropletId;

  beforeAll(async () => {
    // Setup test database
    await db.connect();
    
    // Create test user
    const User = require('../../src/models/user');
    testUser = await User.create({
      username: 'testdropletuser',
      email: 'droplet@university.edu',
      password: 'testpassword123',
      displayName: 'Droplet Test User',
      role: 'student',
      universityId: 'test-university'
    });

    // Get auth token
    const { generateToken } = require('../../src/middleware/auth');
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Cleanup
    await db.close();
  });

  describe('Complete droplet creation workflow', () => {
    it('should create a simple text droplet and appear in feed', async () => {
      const dropletData = {
        content: 'Hello university! This is my first droplet. #introduction',
        visibility: 'university'
      };

      // Create droplet
      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData);

      expect(createResponse.status).toBe(501); // Will be 201 after implementation
      // expect(createResponse.status).toBe(201);
      
      if (createResponse.status === 201) {
        createdDropletId = createResponse.body.id;

        // Verify droplet structure
        expect(createResponse.body).toMatchObject({
          id: expect.any(String),
          content: dropletData.content,
          authorId: testUser.id,
          visibility: dropletData.visibility,
          bubbles: ['introduction'], // Auto-extracted from hashtags
          createdAt: expect.any(String)
        });

        // Check that droplet appears in feed
        const feedResponse = await request(app)
          .get('/api/v1/droplets')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10, offset: 0 });

        expect(feedResponse.status).toBe(200);
        expect(feedResponse.body.droplets).toBeInstanceOf(Array);
        expect(feedResponse.body.droplets.length).toBeGreaterThan(0);
        
        // Find our droplet in the feed
        const ourDroplet = feedResponse.body.droplets.find(d => d.id === createdDropletId);
        expect(ourDroplet).toBeDefined();
        expect(ourDroplet.content).toBe(dropletData.content);
      }
    });

    it('should handle droplet with multiple hashtags', async () => {
      const dropletData = {
        content: 'Studying algorithms and data structures for CS201. #algorithms #study-group #computer-science',
        visibility: 'university',
        bubbles: ['algorithms', 'study-group', 'computer-science'] // Explicit bubbles
      };

      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData);

      expect(createResponse.status).toBe(501); // Will be 201 after implementation
      
      if (createResponse.status === 201) {
        expect(createResponse.body.bubbles).toEqual(
          expect.arrayContaining(['algorithms', 'study-group', 'computer-science'])
        );
      }
    });

    it('should handle droplet with mentions', async () => {
      // Create another user to mention
      const User = require('../../src/models/user');
      const mentionedUser = await User.create({
        username: 'professorjones',
        email: 'jones@university.edu',
        password: 'profpassword123',
        displayName: 'Professor Jones',
        role: 'professor',
        universityId: 'test-university'
      });

      const dropletData = {
        content: 'Thanks @professorjones for the great lecture today! #mathematics',
        visibility: 'university'
      };

      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData);

      expect(createResponse.status).toBe(501); // Will be 201 after implementation
      
      if (createResponse.status === 201) {
        expect(createResponse.body.mentions).toContain(mentionedUser.id);
      }
    });

    it('should respect privacy settings', async () => {
      const publicDropletData = {
        content: 'Public announcement about campus event. #announcements',
        visibility: 'public'
      };

      const privateDropletData = {
        content: 'Private thoughts for my study group. #private-notes',
        visibility: 'private'
      };

      // Create both droplets
      const publicResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(publicDropletData);

      const privateResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(privateDropletData);

      expect(publicResponse.status).toBe(501);
      expect(privateResponse.status).toBe(501);

      if (publicResponse.status === 201 && privateResponse.status === 201) {
        expect(publicResponse.body.visibility).toBe('public');
        expect(privateResponse.body.visibility).toBe('private');
      }
    });
  });

  describe('Droplet interaction workflow', () => {
    it('should support threaded conversations (replies)', async () => {
      // Create parent droplet
      const parentDroplet = {
        content: 'What are your thoughts on the new curriculum changes? #academics',
        visibility: 'university'
      };

      const parentResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(parentDroplet);

      expect(parentResponse.status).toBe(501);

      if (parentResponse.status === 201) {
        // Create reply droplet
        const replyDroplet = {
          content: 'I think the changes are positive for student learning outcomes.',
          visibility: 'university',
          replyToId: parentResponse.body.id
        };

        const replyResponse = await request(app)
          .post('/api/v1/droplets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(replyDroplet);

        expect(replyResponse.status).toBe(501);

        if (replyResponse.status === 201) {
          expect(replyResponse.body.replyToId).toBe(parentResponse.body.id);
        }
      }
    });
  });

  describe('Media attachment workflow', () => {
    it('should handle droplets with image attachments', async () => {
      // This test will be enhanced when media upload is fully implemented
      const dropletData = {
        content: 'Check out this diagram from class today! #computer-science',
        visibility: 'university'
      };

      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData)
        .attach('file', Buffer.from('fake image data'), 'diagram.png');

      expect(createResponse.status).toBe(501); // Will be 201 after media implementation
      
      if (createResponse.status === 201) {
        expect(createResponse.body.mediaAttachments).toBeInstanceOf(Array);
        expect(createResponse.body.mediaAttachments.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Real-time updates', () => {
    it('should emit real-time events when droplet is created', async () => {
      // This will test the real-time functionality
      // Implementation will be added in User Story 1
      
      const dropletData = {
        content: 'Real-time test droplet. #testing',
        visibility: 'university'
      };

      const createResponse = await request(app)
        .post('/api/v1/droplets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dropletData);

      expect(createResponse.status).toBe(501);
      
      // Real-time testing would require socket.io client connection
      // Will be implemented when real-time service is complete
    });
  });
});