const { test, expect } = require('@playwright/test');

test.describe('Content Creation and Feed Display', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for development
    await page.route('**/api/v1/droplets*', route => {
      // Mock droplet creation response
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-droplet-id',
            content: 'Test droplet content',
            authorId: 'mock-user-id',
            bubbles: ['test'],
            visibility: 'university',
            createdAt: new Date().toISOString()
          })
        });
      }
      // Mock feed response
      else if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            droplets: [
              {
                id: 'existing-droplet-1',
                content: 'Existing droplet in feed',
                authorId: 'other-user-id',
                authorName: 'Other User',
                bubbles: ['existing'],
                visibility: 'university',
                createdAt: new Date().toISOString()
              }
            ],
            hasMore: false
          })
        });
      }
    });

    // Mock authentication
    await page.route('**/api/v1/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 'mock-user-id',
            username: 'testuser',
            displayName: 'Test User',
            role: 'student'
          }
        })
      });
    });
  });

  test('should display content creation form', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if droplet creation form exists
    await expect(page.locator('[data-testid="droplet-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="droplet-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="droplet-submit"]')).toBeVisible();
  });

  test('should create droplet and update feed', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill droplet form
    const dropletContent = 'Hello university! This is my first droplet. #introduction';
    await page.fill('[data-testid="droplet-textarea"]', dropletContent);
    
    // Submit form
    await page.click('[data-testid="droplet-submit"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Check if droplet appears in feed
    await expect(page.locator('[data-testid="droplet-item"]').first()).toContainText(dropletContent);
  });

  test('should validate droplet content', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Try to submit empty droplet
    await page.click('[data-testid="droplet-submit"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('content is required');
  });

  test('should handle hashtag input', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Type droplet with hashtags
    const content = 'Studying CS201 algorithms. #algorithms #study-group #computer-science';
    await page.fill('[data-testid="droplet-textarea"]', content);
    
    // Check if hashtags are recognized
    await expect(page.locator('[data-testid="hashtag-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="hashtag-item"]')).toHaveCount(3);
  });

  test('should display feed with existing droplets', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for feed to load
    await expect(page.locator('[data-testid="feed-container"]')).toBeVisible();
    
    // Check if existing droplets are displayed
    await expect(page.locator('[data-testid="droplet-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="droplet-item"]')).toContainText('Existing droplet in feed');
  });

  test('should support real-time feed updates', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock real-time update
    await page.evaluate(() => {
      // Simulate receiving a real-time droplet
      window.dispatchEvent(new CustomEvent('droplet:created', {
        detail: {
          id: 'realtime-droplet',
          content: 'New real-time droplet! #updates',
          authorName: 'Real-time User',
          createdAt: new Date().toISOString()
        }
      }));
    });
    
    // Check if real-time droplet appears in feed
    await expect(page.locator('[data-testid="realtime-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="droplet-item"]')).toContainText('New real-time droplet!');
  });

  test('should handle character limit', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const longContent = 'a'.repeat(5001); // Exceeds 5000 limit
    await page.fill('[data-testid="droplet-textarea"]', longContent);
    
    // Should show character limit warning
    await expect(page.locator('[data-testid="character-limit-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="droplet-submit"]')).toBeDisabled();
  });

  test('should support media attachment', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock file upload
    const fileInput = page.locator('[data-testid="media-upload"]');
    await fileInput.setInputFiles('test-image.png');
    
    // Should show file preview
    await expect(page.locator('[data-testid="media-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-remove-button"]')).toBeVisible();
  });

  test('should handle visibility settings', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Open visibility dropdown
    await page.click('[data-testid="visibility-selector"]');
    
    // Check visibility options
    await expect(page.locator('[data-testid="visibility-public"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-university"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-bubble"]')).toBeVisible();
    await expect(page.locator('[data-testid="visibility-private"]')).toBeVisible();
    
    // Select private visibility
    await page.click('[data-testid="visibility-private"]');
    await expect(page.locator('[data-testid="visibility-selector"]')).toContainText('Private');
  });

  test('should support user mentions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Type content with mention
    await page.fill('[data-testid="droplet-textarea"]', 'Thanks @professorjones for the lecture! #mathematics');
    
    // Should show mention suggestions
    await expect(page.locator('[data-testid="mention-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="mention-item"]')).toHaveCount.greaterThan(0);
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Mock paginated feed
    await page.route('**/api/v1/droplets*', route => {
      if (route.request().method() === 'GET') {
        const url = route.request().url();
        const urlParams = new URLSearchParams(url.split('?')[1]);
        
        if (urlParams.get('offset') === '0') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              droplets: Array(20).fill().map((_, i) => ({
                id: `droplet-${i}`,
                content: `Droplet ${i + 1}`,
                authorName: 'User',
                createdAt: new Date().toISOString()
              })),
              hasMore: true
            })
          });
        } else if (urlParams.get('offset') === '20') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              droplets: Array(10).fill().map((_, i) => ({
                id: `droplet-${i + 20}`,
                content: `Droplet ${i + 21}`,
                authorName: 'User',
                createdAt: new Date().toISOString()
              })),
              hasMore: false
            })
          });
        }
      }
    });
    
    // Load more button should appear
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-testid="load-more"]')).toBeVisible();
    
    // Click load more
    await page.click('[data-testid="load-more"]');
    await expect(page.locator('[data-testid="droplet-item"]')).toHaveCount(30);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/droplets*', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR'
          })
        });
      }
    });
    
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="droplet-textarea"]', 'Test droplet');
    await page.click('[data-testid="droplet-submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to create droplet');
  });
});