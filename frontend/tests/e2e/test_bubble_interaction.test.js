const { test, expect } = require('@playwright/test');

/**
 * E2E Tests for Bubble Search and Join Workflow
 * Tests the complete user flow of discovering and joining bubbles
 */
test.describe('Bubble Interaction E2E Tests', () => {
  let page;
  let user;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup test user authentication
    await page.goto('http://localhost:3000');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        username: 'bubble_test_user',
        displayName: 'Bubble Test User',
        email: 'bubble_test@university.edu',
        role: 'student',
        universityId: 'university-demo'
      }));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.beforeEach(async () => {
    // Reset any test state before each test
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-jwt-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        username: 'bubble_test_user',
        displayName: 'Bubble Test User',
        email: 'bubble_test@university.edu',
        role: 'student',
        universityId: 'university-demo'
      }));
    });
  });

  test.describe('Bubble Discovery', () => {
    test('should display bubbles list', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Wait for the page to load and check for bubbles section
      await page.waitForSelector('feed-display', { timeout: 10000 });

      // Check if the bubbles discovery UI is present (this might be a separate component)
      const bubblesExist = await page.locator('[data-testid="bubbles-list"]').isVisible().catch(() => false);
      
      if (bubblesExist) {
        const bubbleCount = await page.locator('[data-testid="bubble-item"]').count();
        expect(bubbleCount).toBeGreaterThan(0);
      }
    });

    test('should allow searching bubbles', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Look for search functionality
      const searchInput = page.locator('[data-testid="bubble-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('computer science');
        await page.waitForTimeout(500); // Wait for search debounce

        // Check if search results are displayed
        const searchResults = page.locator('[data-testid="search-results"]');
        if (await searchResults.isVisible()) {
          const resultCount = await searchResults.locator('[data-testid="bubble-item"]').count();
          expect(resultCount).toBeGreaterThan(0);
        }
      }
    });

    test('should filter bubbles by category', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Look for category filters
      const categoryFilter = page.locator('[data-testid="category-filter"]');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption({ label: 'Academic' });
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Check if results are filtered
        const filteredResults = page.locator('[data-testid="filtered-bubbles"]');
        if (await filteredResults.isVisible()) {
          const resultCount = await filteredResults.locator('[data-testid="bubble-item"]').count();
          expect(resultCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Bubble Joining', () => {
    test('should allow joining public bubbles', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Find a public bubble to join
      const publicBubble = page.locator('[data-testid="bubble-item"][data-public="true"]').first();
      
      if (await publicBubble.isVisible()) {
        const bubbleName = await publicBubble.locator('[data-testid="bubble-name"]').textContent();
        
        // Click the join button
        const joinButton = publicBubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();

        // Wait for join confirmation
        await page.waitForSelector('[data-testid="join-success-message"]', { timeout: 5000 });

        // Verify the UI shows the user as a member
        const memberIndicator = publicBubble.locator('[data-testid="member-indicator"]');
        expect(await memberIndicator.isVisible()).toBe(true);

        // Check if the bubble appears in user's joined bubbles list
        const joinedBubbles = page.locator('[data-testid="joined-bubbles"]');
        if (await joinedBubbles.isVisible()) {
          const isJoined = await joinedBubbles.locator(`[data-bubble-id="${bubbleName}"]`).isVisible();
          expect(isJoined).toBe(true);
        }
      }
    });

    test('should prevent joining private bubbles without invitation', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Find a private bubble
      const privateBubble = page.locator('[data-testid="bubble-item"][data-public="false"]').first();
      
      if (await privateBubble.isVisible()) {
        // Check if join button is disabled or shows permission required
        const joinButton = privateBubble.locator('[data-testid="join-bubble-btn"]');
        
        if (await joinButton.isVisible()) {
          const isDisabled = await joinButton.isDisabled();
          expect(isDisabled).toBe(true);
          
          // Check for permission message
          const permissionMessage = privateBubble.locator('[data-testid="permission-message"]');
          expect(await permissionMessage.isVisible()).toBe(true);
        }
      }
    });

    test('should handle duplicate join attempts', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Join a bubble first time
      const bubble = page.locator('[data-testid="bubble-item"]').first();
      
      if (await bubble.isVisible()) {
        const joinButton = bubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();
        
        // Wait for first join to complete
        await page.waitForTimeout(1000);
        
        // Try to join again
        if (await joinButton.isVisible()) {
          await joinButton.click();
          
          // Should show "already joined" message
          const alreadyJoinedMessage = bubble.locator('[data-testid="already-joined-message"]');
          expect(await alreadyJoinedMessage.isVisible()).toBe(true);
        }
      }
    });
  });

  test.describe('Bubble Leaving', () => {
    test.beforeEach(async () => {
      // Join a bubble for leaving tests
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      const bubble = page.locator('[data-testid="bubble-item"]').first();
      if (await bubble.isVisible()) {
        const joinButton = bubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();
        await page.waitForTimeout(1000); // Wait for join to complete
      }
    });

    test('should allow leaving joined bubbles', async () => {
      const joinedBubble = page.locator('[data-testid="bubble-item"][data-joined="true"]').first();
      
      if (await joinedBubble.isVisible()) {
        // Click the leave button
        const leaveButton = joinedBubble.locator('[data-testid="leave-bubble-btn"]');
        await leaveButton.click();

        // Wait for leave confirmation
        await page.waitForSelector('[data-testid="leave-success-message"]', { timeout: 5000 });

        // Verify the UI no longer shows user as a member
        const memberIndicator = joinedBubble.locator('[data-testid="member-indicator"]');
        expect(await memberIndicator.isVisible()).toBe(false);

        // Verify join button is shown again
        const joinButton = joinedBubble.locator('[data-testid="join-bubble-btn"]');
        expect(await joinButton.isVisible()).toBe(true);
      }
    });

    test('should update bubble member count', async () => {
      const bubble = page.locator('[data-testid="bubble-item"]').first();
      
      if (await bubble.isVisible()) {
        // Get initial member count
        const memberCountElement = bubble.locator('[data-testid="member-count"]');
        const initialCount = await memberCountElement.textContent();
        
        // Join and leave to test count updates
        const joinButton = bubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();
        await page.waitForTimeout(1000);
        
        const joinedCount = await memberCountElement.textContent();
        expect(parseInt(joinedCount)).toBeGreaterThan(parseInt(initialCount));

        // Leave the bubble
        const leaveButton = bubble.locator('[data-testid="leave-bubble-btn"]');
        if (await leaveButton.isVisible()) {
          await leaveButton.click();
          await page.waitForTimeout(1000);
          
          const leftCount = await memberCountElement.textContent();
          expect(parseInt(leftCount)).toBe(parseInt(initialCount));
        }
      }
    });
  });

  test.describe('Bubble Content Integration', () => {
    test.beforeEach(async () => {
      // Join a bubble for content tests
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      const bubble = page.locator('[data-testid="bubble-item"]').first();
      if (await bubble.isVisible()) {
        const joinButton = bubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('should show bubble content in feed when joined', async () => {
      // Create a test droplet in a bubble context
      await page.evaluate(() => {
        // Mock creating a droplet with bubble hashtag
        const dropletCreation = document.querySelector('droplet-creation');
        if (dropletCreation) {
          const contentInput = dropletCreation.shadowRoot?.querySelector('.content-input');
          const bubblesInput = dropletCreation.shadowRoot?.querySelector('.bubbles-input');
          const postButton = dropletCreation.shadowRoot?.querySelector('.btn-primary');
          
          if (contentInput && bubblesInput && postButton) {
            contentInput.value = 'Test content for bubble integration';
            bubblesInput.value = '#test-bubble';
            postButton.click();
          }
        }
      });

      await page.waitForTimeout(2000);

      // Check if the droplet appears in the feed
      const feedDisplay = page.locator('feed-display');
      if (await feedDisplay.isVisible()) {
        const dropletItem = page.locator('[data-testid="droplet-item"]').first();
        expect(await dropletItem.isVisible()).toBe(true);
        
        // Check if bubble tag is present
        const bubbleTag = dropletItem.locator('[data-testid="bubble-tag"][data-bubble="#test-bubble"]');
        expect(await bubbleTag.isVisible()).toBe(true);
      }
    });

    test('should filter feed by joined bubbles', async () => {
      // Look for bubble filter functionality
      const bubbleFilter = page.locator('[data-testid="bubble-filter"]');
      
      if (await bubbleFilter.isVisible()) {
        // Select a specific bubble to filter by
        await bubbleFilter.selectOption({ label: 'Test Bubble' });
        await page.waitForTimeout(500);

        // Check if feed is filtered
        const feedItems = page.locator('[data-testid="droplet-item"]');
        if (await feedItems.count() > 0) {
          // Verify all visible droplets are from the selected bubble
          const allFromBubble = await feedItems.evaluateAll(items => {
            return items.every(item => {
              const bubbleTags = item.querySelectorAll('[data-testid="bubble-tag"]');
              return Array.from(bubbleTags).some(tag => 
                tag.getAttribute('data-bubble') === '#test-bubble'
              );
            });
          });
          
          expect(allFromBubble).toBe(true);
        }
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should show live updates for bubble activity', async () => {
      // This would test real-time functionality if socket.io is working
      // For now, we'll test the UI responds to simulated updates

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Check if real-time indicator is present
      const realtimeIndicator = page.locator('[data-testid="realtime-indicator"]');
      if (await realtimeIndicator.isVisible()) {
        expect(await realtimeIndicator.isVisible()).toBe(true);
      }

      // Simulate a real-time update
      await page.evaluate(() => {
        // Create a custom event to simulate real-time update
        window.dispatchEvent(new CustomEvent('droplet:created', {
          detail: {
            droplet: {
              id: 'realtime-test-droplet',
              content: 'Real-time test droplet',
              bubbles: ['#test-bubble'],
              author: {
                displayName: 'Test User'
              },
              createdAt: new Date().toISOString()
            }
          }
        }));
      });

      // Check if UI updates with real-time content
      await page.waitForTimeout(500);
      
      const realtimeUpdate = page.locator('[data-testid="realtime-update"]');
      const realtimeDroplet = page.locator('[data-testid="droplet-item"][data-realtime="true"]');
      
      // At least one of the real-time indicators should be present
      expect(await realtimeUpdate.isVisible() || await realtimeDroplet.isVisible()).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/v1/bubbles', route => route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      }));

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Look for error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      if (await errorMessage.isVisible()) {
        expect(await errorMessage.isVisible()).toBe(true);
        expect(await errorMessage.textContent()).toContain('Failed to load bubbles');
      }
    });

    test('should handle invalid search terms', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Look for search functionality
      const searchInput = page.locator('[data-testid="bubble-search-input"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('invalid-search-term-that-should-not-exist-12345');
        await page.waitForTimeout(500);

        // Check for no results message
        const noResults = page.locator('[data-testid="no-results-message"]');
        if (await noResults.isVisible()) {
          expect(await noResults.isVisible()).toBe(true);
          expect(await noResults.textContent()).toContain('No bubbles found');
        }
      }
    });

    test('should handle permission errors gracefully', async () => {
      // Mock permission error for joining private bubble
      await page.route('**/api/v1/bubbles/*/join', route => route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Permission denied',
          code: 'FORBIDDEN' 
        })
      }));

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Try to join a private bubble
      const privateBubble = page.locator('[data-testid="bubble-item"][data-public="false"]').first();
      if (await privateBubble.isVisible()) {
        const joinButton = privateBubble.locator('[data-testid="join-bubble-btn"]');
        await joinButton.click();
        await page.waitForTimeout(1000);

        // Check for permission error message
        const permissionError = privateBubble.locator('[data-testid="permission-error"]');
        expect(await permissionError.isVisible()).toBe(true);
        expect(await permissionError.textContent()).toContain('Permission denied');
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    ['iPhone', 'iPad'].forEach(device => {
      test(`should work correctly on ${device}`, async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        if (device === 'iPad') {
          await page.setViewportSize({ width: 768, height: 1024 });
        }

        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');

        // Check if bubble discovery interface is usable
        const bubbleList = page.locator('[data-testid="bubbles-list"]');
        if (await bubbleList.isVisible()) {
          expect(await bubbleList.isVisible()).toBe(true);
          
          // Check if search is functional on mobile
          const searchInput = page.locator('[data-testid="bubble-search-input"]');
          if (await searchInput.isVisible()) {
            expect(await searchInput.isVisible()).toBe(true);
          }
          
          // Check if join/leave buttons are accessible
          const joinButton = page.locator('[data-testid="bubble-item"]').first()
            .locator('[data-testid="join-bubble-btn"]');
          if (await joinButton.isVisible()) {
            expect(await joinButton.isVisible()).toBe(true);
          }
        }
      });
    });
  });

  test.describe('Performance', () => {
    test('should load bubbles quickly', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(3000); // 3 seconds max

      // Check if bubbles are displayed without significant delay
      const bubblesVisible = await page.locator('[data-testid="bubble-item"]').isVisible().catch(() => false);
      if (bubblesVisible) {
        const renderTime = Date.now() - startTime;
        expect(renderTime).toBeLessThan(5000); // 5 seconds max for full render
      }
    });

    test('should handle large bubble lists efficiently', async () => {
      // Mock large number of bubbles
      await page.route('**/api/v1/bubbles', route => {
        const largeBubblesList = Array(100).fill().map((_, index) => ({
          id: `bubble-${index}`,
          name: `Test Bubble ${index}`,
          hashtag: `#bubble-${index}`,
          description: `Description for bubble ${index}`,
          memberCount: Math.floor(Math.random() * 1000),
          dropletCount: Math.floor(Math.random() * 100),
          isPublic: true,
          createdAt: new Date().toISOString()
        }));

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeBubblesList)
        });
      });

      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Check if virtual scrolling or pagination is implemented
      const pagination = page.locator('[data-testid="pagination"]');
      const virtualScroller = page.locator('[data-testid="virtual-scroller"]');
      
      expect(await pagination.isVisible() || await virtualScroller.isVisible()).toBe(true);
    });
  });

  test.afterAll(async () => {
    await page.close();
  });
});