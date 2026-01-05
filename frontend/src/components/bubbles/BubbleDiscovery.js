/**
 * BubbleDiscovery Component
 * Handles bubble discovery, search, filtering, and joining
 */
class BubbleDiscovery extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.bubbles = [];
    this.isLoading = false;
    this.hasMore = true;
    this.currentOffset = 0;
    this.currentLimit = 20;
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.userJoinedBubbles = new Set();
    this.user = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.loadInitialBubbles();
    this.loadUserInfo();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .bubble-discovery {
          padding: 20px;
        }

        .discovery-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e1e5e9;
        }

        .discovery-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .create-bubble-btn {
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .create-bubble-btn:hover {
          background: #1565c0;
        }

        .search-section {
          margin-bottom: 20px;
        }

        .search-container {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
        }

        .search-btn {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .search-btn:hover {
          background: #1976d2;
          color: white;
        }

        .filter-section {
          margin-bottom: 20px;
        }

        .filter-container {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-label {
          font-weight: 500;
          color: #666;
          margin-right: 10px;
        }

        .category-select {
          padding: 8px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
        }

        .category-select:focus {
          outline: none;
          border-color: #1976d2;
        }

        .visibility-filter {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .bubbles-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .bubble-card {
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          padding: 20px;
          background: white;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .bubble-card:hover {
          border-color: #1976d2;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .bubble-card.joined {
          background: #e8f5e8;
          border-color: #4caf50;
        }

        .bubble-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .bubble-info {
          flex: 1;
        }

        .bubble-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .bubble-hashtag {
          color: #1976d2;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .bubble-description {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bubble-stats {
          display: flex;
          gap: 20px;
          font-size: 0.85rem;
          color: #666;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-number {
          font-weight: 600;
          color: #333;
        }

        .bubble-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .join-btn {
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .join-btn:hover {
          background: #1565c0;
        }

        .join-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .joined-btn {
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .leave-btn {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .leave-btn:hover {
          background: #d32f2f;
        }

        .private-indicator {
          background: #fff3e0;
          color: #f57c00;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1976d2;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .load-more {
          text-align: center;
          padding: 20px;
        }

        .load-more-btn {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          padding: 12px 24px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .load-more-btn:hover {
          background: #1976d2;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 20px;
        }

        .create-bubble-prompt {
          background: #e3f2fd;
          border: 1px solid #1976d2;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .discovery-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .filter-container {
            flex-direction: column;
            align-items: stretch;
          }

          .visibility-filter {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .bubbles-list {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .bubble-stats {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .bubble-actions {
            flex-direction: column;
            gap: 8px;
          }

          .join-btn, .joined-btn, .leave-btn {
            width: 100%;
          }
        }
      </style>

      <div class="bubble-discovery">
        <div class="discovery-header">
          <h2 class="discovery-title">Discover Bubbles</h2>
          <button class="create-bubble-btn" id="createBubbleBtn">
            ➕ Create Bubble
          </button>
        </div>

        <div class="search-section">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              id="searchInput"
              placeholder="Search bubbles by name or hashtag..."
            >
            <button class="search-btn" id="searchBtn">🔍 Search</button>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-container">
            <div class="filter-label">Category:</div>
            <select class="category-select" id="categorySelect">
              <option value="all">All Categories</option>
              <option value="academic">📚 Academic</option>
              <option value="social">🎉 Social</option>
              <option value="study">📖 Study Groups</option>
              <option value="research">🔬 Research</option>
              <option value="help">💬 Help & Support</option>
              <option value="clubs">🏆 Clubs & Organizations</option>
            </select>
          </div>

          <div class="visibility-filter">
            <label class="checkbox-label">
              <input type="checkbox" id="publicOnlyCheckbox">
              Public bubbles only
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="joinedOnlyCheckbox">
              Joined bubbles only
            </label>
          </div>
        </div>

        <div class="bubbles-list" id="bubblesList">
          <!-- Bubbles will be rendered here -->
        </div>

        <div class="loading" id="loading" style="display: none;">
          <div class="loading-spinner"></div>
          <div>Loading bubbles...</div>
        </div>

        <div class="load-more" id="loadMore" style="display: none;">
          <button class="load-more-btn" id="loadMoreBtn">
            Load More Bubbles
          </button>
        </div>

        <div class="empty-state" id="emptyState" style="display: none;">
          <div class="empty-icon">🔍</div>
          <h3 class="empty-title">No Bubbles Found</h3>
          <p class="empty-description">
            Try adjusting your search or filters, or create a new bubble to get started!
          </p>
          <div class="create-bubble-prompt">
            <button class="create-bubble-btn" onclick="document.getElementById('createBubbleBtn').click()">
              🫧 Create Your First Bubble
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById('searchInput');
    const searchBtn = this.shadowRoot.getElementById('searchBtn');
    const categorySelect = this.shadowRoot.getElementById('categorySelect');
    const publicOnlyCheckbox = this.shadowRoot.getElementById('publicOnlyCheckbox');
    const joinedOnlyCheckbox = this.shadowRoot.getElementById('joinedOnlyCheckbox');
    const loadMoreBtn = this.shadowRoot.getElementById('loadMoreBtn');

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 300);
    });

    searchBtn.addEventListener('click', () => {
      this.handleSearch(searchInput.value);
    });

    // Category filter
    categorySelect.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.loadBubbles();
    });

    // Visibility filters
    publicOnlyCheckbox.addEventListener('change', () => {
      this.loadBubbles();
    });

    joinedOnlyCheckbox.addEventListener('change', () => {
      this.loadBubbles();
    });

    // Load more
    loadMoreBtn.addEventListener('click', () => {
      this.loadMoreBubbles();
    });

    // Create bubble button
    const createBubbleBtn = this.shadowRoot.getElementById('createBubbleBtn');
    createBubbleBtn.addEventListener('click', () => {
      this.emit('bubble:create-request');
    });

    // Infinite scroll
    this.shadowRoot.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.shadowRoot.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100 && !this.isLoading && this.hasMore) {
        this.loadMoreBubbles();
      }
    });
  }

  async loadUserInfo() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.user = await response.json();
        this.userJoinedBubbles = new Set(this.user.joinedBubbles || []);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  async loadInitialBubbles() {
    try {
      this.showLoading();
      const response = await fetch(`/api/v1/bubbles?limit=${this.currentLimit}`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        this.bubbles = data.bubbles;
        this.hasMore = data.hasMore;
        this.currentOffset = this.bubbles.length;
        
        this.renderBubbles();
        this.updateLoadMoreButton();
      } else {
        throw new Error('Failed to load bubbles');
      }
    } catch (error) {
      console.error('Error loading initial bubbles:', error);
      this.showError('Failed to load bubbles');
    } finally {
      this.hideLoading();
    }
  }

  async handleSearch(query) {
    this.searchQuery = query.trim();
    this.currentOffset = 0;
    await this.loadBubbles();
  }

  async loadBubbles() {
    try {
      this.isLoading = true;
      this.showLoading();

      const params = new URLSearchParams({
        limit: this.currentLimit,
        offset: this.currentOffset
      });

      // Add search query
      if (this.searchQuery) {
        params.append('search', this.searchQuery);
      }

      // Add category filter
      if (this.selectedCategory !== 'all') {
        params.append('category', this.selectedCategory);
      }

      // Add visibility filters
      const publicOnlyCheckbox = this.shadowRoot.getElementById('publicOnlyCheckbox');
      const joinedOnlyCheckbox = this.shadowRoot.getElementById('joinedOnlyCheckbox');
      
      if (publicOnlyCheckbox.checked) {
        params.append('isPublic', 'true');
      }

      if (joinedOnlyCheckbox.checked) {
        // This would be handled differently in a real implementation
        // For now, we'll just skip filtering by joined status
      }

      const response = await fetch(`/api/v1/bubbles?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        if (this.currentOffset === 0) {
          // First load, replace all bubbles
          this.bubbles = data.bubbles;
        } else {
          // Append to existing bubbles
          this.bubbles.push(...data.bubbles);
        }
        
        this.hasMore = data.hasMore;
        this.currentOffset += data.bubbles.length;
        
        this.renderBubbles();
        this.updateLoadMoreButton();
      } else {
        throw new Error('Failed to load bubbles');
      }
    } catch (error) {
      console.error('Error loading bubbles:', error);
      this.showError('Failed to load bubbles');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  async loadMoreBubbles() {
    if (this.isLoading || !this.hasMore) return;
    
    await this.loadBubbles();
  }

  async joinBubble(bubbleId) {
    try {
      const response = await fetch(`/api/v1/bubbles/${bubbleId}/join`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        this.userJoinedBubbles.add(bubbleId);
        
        // Update UI
        const bubbleCard = this.shadowRoot.querySelector(`[data-bubble-id="${bubbleId}"]`);
        if (bubbleCard) {
          bubbleCard.classList.add('joined');
          this.updateBubbleActions(bubbleCard, 'joined');
        }

        // Show success message
        this.showSuccessMessage(data.message);
        
        // Emit event
        this.emit('bubble:joined', { bubbleId, bubble: data.bubble });
      } else {
        this.showErrorMessage(data.error || 'Failed to join bubble');
      }
    } catch (error) {
      console.error('Error joining bubble:', error);
      this.showErrorMessage('Failed to join bubble');
    }
  }

  async leaveBubble(bubbleId) {
    try {
      const response = await fetch(`/api/v1/bubbles/${bubbleId}/leave`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        this.userJoinedBubbles.delete(bubbleId);
        
        // Update UI
        const bubbleCard = this.shadowRoot.querySelector(`[data-bubble-id="${bubbleId}"]`);
        if (bubbleCard) {
          bubbleCard.classList.remove('joined');
          this.updateBubbleActions(bubbleCard, 'available');
        }

        // Show success message
        this.showSuccessMessage(data.message);
        
        // Emit event
        this.emit('bubble:left', { bubbleId });
      } else {
        this.showErrorMessage(data.error || 'Failed to leave bubble');
      }
    } catch (error) {
      console.error('Error leaving bubble:', error);
      this.showErrorMessage('Failed to leave bubble');
    }
  }

  renderBubbles() {
    const bubblesList = this.shadowRoot.getElementById('bubblesList');
    const emptyState = this.shadowRoot.getElementById('emptyState');

    if (this.bubbles.length === 0) {
      bubblesList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    bubblesList.style.display = 'grid';
    emptyState.style.display = 'none';

    bubblesList.innerHTML = this.bubbles.map(bubble => this.createBubbleCard(bubble)).join('');
  }

  createBubbleCard(bubble) {
    const isJoined = this.userJoinedBubbles.has(bubble.id);
    const isCreator = this.user && bubble.creatorId === this.user.id;
    const isModerator = this.user && bubble.moderators && bubble.moderators.includes(this.user.id);
    const canJoin = !isJoined && bubble.isPublic;
    
    return `
      <div class="bubble-card ${isJoined ? 'joined' : ''}" data-bubble-id="${bubble.id}">
        <div class="bubble-header">
          <div class="bubble-info">
            <div class="bubble-name">${this.escapeHtml(bubble.name)}</div>
            <div class="bubble-hashtag">${this.escapeHtml(bubble.hashtag)}</div>
            ${bubble.description ? `<div class="bubble-description">${this.escapeHtml(bubble.description)}</div>` : ''}
          </div>
          ${!bubble.isPublic ? '<div class="private-indicator">🔒 Private</div>' : ''}
        </div>
        <div class="bubble-stats">
          <div class="stat">
            <span class="stat-number">${bubble.memberCount}</span>
            <span>members</span>
          </div>
          <div class="stat">
            <span class="stat-number">${bubble.dropletCount}</span>
            <span>droplets</span>
          </div>
        </div>
      </div>
      
      <div class="bubble-actions">
        ${this.createBubbleActions(bubble, isJoined, isCreator, isModerator, canJoin)}
      </div>
    `;
  }

  createBubbleActions(bubble, isJoined, isCreator, isModerator, canJoin) {
    if (isJoined) {
      return `
        <button class="joined-btn" disabled>
          ✅ Joined
        </button>
        ${isCreator || isModerator ? `
          <button class="leave-btn" onclick="this.closest('bubble-discovery').leaveBubble('${bubble.id}')">
            Leave Bubble
          </button>
        ` : ''}
      `;
    } else if (canJoin) {
      return `
        <button class="join-btn" onclick="this.closest('bubble-discovery').joinBubble('${bubble.id}')">
          Join Bubble
        </button>
      `;
    } else {
      return `
        <span style="color: #999; font-size: 0.85rem;">
          ${!bubble.isPublic ? 'Private - Invitation required' : 'Joining not available'}
        </span>
      `;
    }
  }

  updateBubbleActions(bubbleCard, status) {
    const actionsContainer = bubbleCard.querySelector('.bubble-actions');
    if (!actionsContainer) return;

    const bubbleId = bubbleCard.dataset.bubbleId;
    const bubble = this.bubbles.find(b => b.id === bubbleId);
    
    if (!bubble) return;

    actionsContainer.innerHTML = this.createBubbleActions(
      bubble,
      status === 'joined',
      this.user && bubble.creatorId === this.user.id,
      this.user && bubble.moderators && bubble.moderators.includes(this.user.id),
      bubble.isPublic
    );
  }

  showLoading() {
    const loading = this.shadowRoot.getElementById('loading');
    const bubblesList = this.shadowRoot.getElementById('bubblesList');
    const loadMore = this.shadowRoot.getElementById('loadMore');
    
    loading.style.display = 'block';
    bubblesList.style.display = 'none';
    loadMore.style.display = 'none';
  }

  hideLoading() {
    const loading = this.shadowRoot.getElementById('loading');
    loading.style.display = 'none';
  }

  updateLoadMoreButton() {
    const loadMore = this.shadowRoot.getElementById('loadMore');
    
    if (this.hasMore && this.bubbles.length > 0) {
      loadMore.style.display = 'block';
    } else {
      loadMore.style.display = 'none';
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccessMessage(message) {
    // Create a temporary success message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  showErrorMessage(message) {
    // Create a temporary error message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 5000);
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true
    }));
  }
}

// Register the custom element
customElements.define('bubble-discovery', BubbleDiscovery);

export default BubbleDiscovery;