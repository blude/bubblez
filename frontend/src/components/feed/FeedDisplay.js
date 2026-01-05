/**
 * FeedDisplay Component
 * Displays a real-time feed of droplets with filtering and pagination
 */
class FeedDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.droplets = [];
    this.isLoading = false;
    this.hasMore = true;
    this.currentOffset = 0;
    this.currentLimit = 20;
    this.filterBubbles = [];
    this.searchQuery = '';
    this.user = null;
    this.socket = null;
    this.realtimeEnabled = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.loadInitialFeed();
    this.initializeRealtime();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .feed-container {
          padding: 20px;
        }

        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e1e5e9;
        }

        .feed-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .feed-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .search-input {
          padding: 8px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 0.9rem;
          width: 200px;
        }

        .search-input:focus {
          outline: none;
          border-color: #1976d2;
        }

        .filter-btn {
          padding: 8px 16px;
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .filter-btn:hover {
          background: #e3f2fd;
          border-color: #1976d2;
        }

        .filter-btn.active {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }

        .realtime-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          color: #4caf50;
        }

        .realtime-dot {
          width: 8px;
          height: 8px;
          background: #4caf50;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .droplet-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .droplet-item {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          background: white;
          transition: box-shadow 0.2s;
        }

        .droplet-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .droplet-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .droplet-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1976d2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 12px;
          font-size: 1.2rem;
        }

        .droplet-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .droplet-meta {
          flex: 1;
        }

        .droplet-author {
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
        }

        .droplet-role {
          font-size: 0.85rem;
          color: #666;
          margin-left: 8px;
        }

        .droplet-time {
          font-size: 0.85rem;
          color: #999;
        }

        .droplet-visibility {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 8px;
        }

        .visibility-public {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .visibility-university {
          background: #e3f2fd;
          color: #1976d2;
        }

        .visibility-bubble {
          background: #fff3e0;
          color: #f57c00;
        }

        .visibility-private {
          background: #fce4ec;
          color: #c2185b;
        }

        .droplet-content {
          margin-bottom: 15px;
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .droplet-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 15px;
        }

        .bubble-tag {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 0.85rem;
          color: #1976d2;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
        }

        .bubble-tag:hover {
          background: #1976d2;
          color: white;
        }

        .droplet-media {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 15px;
        }

        .media-item {
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .media-item:hover {
          transform: scale(1.05);
        }

        .media-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          display: block;
        }

        .media-item.video {
          position: relative;
        }

        .media-item.video::after {
          content: '▶';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .media-item.document {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          padding: 20px;
          text-align: center;
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .media-item.document .icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }

        .droplet-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s, color 0.2s;
        }

        .action-btn:hover {
          background: #f5f5f5;
          color: #333;
        }

        .action-btn.active {
          color: #1976d2;
          font-weight: 500;
        }

        .action-btn .count {
          font-weight: 500;
        }

        .loading-more {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .loading-spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1976d2;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin: 0 auto 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .load-more-btn {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          padding: 12px 24px;
          cursor: pointer;
          font-size: 0.9rem;
          margin: 20px auto;
          display: block;
          transition: background-color 0.2s;
        }

        .load-more-btn:hover {
          background: #e3f2fd;
          border-color: #1976d2;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-state .icon {
          font-size: 3rem;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .realtime-update {
          background: #e8f5e8;
          border: 1px solid #4caf50;
          border-radius: 8px;
          padding: 10px 15px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .filter-panel {
          background: white;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          display: none;
        }

        .filter-panel.show {
          display: block;
        }

        .filter-section {
          margin-bottom: 15px;
        }

        .filter-label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: #333;
        }

        .filter-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-bubble {
          padding: 4px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 16px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .filter-bubble.selected {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }

        .filter-bubble:hover:not(.selected) {
          background: #f5f5f5;
        }
      </style>

      <div class="feed-container">
        <div class="feed-header">
          <h2 class="feed-title">University Feed</h2>
          <div class="feed-controls">
            <input 
              type="text" 
              class="search-input" 
              id="searchInput"
              placeholder="Search droplets..."
            >
            <button class="filter-btn" id="filterBtn">🔍 Filters</button>
            <div class="realtime-indicator" id="realtimeIndicator" style="display: none;">
              <div class="realtime-dot"></div>
              <span>Live</span>
            </div>
          </div>
        </div>

        <div class="filter-panel" id="filterPanel">
          <div class="filter-section">
            <label class="filter-label">Filter by topics:</label>
            <div class="filter-bubbles" id="filterBubbles"></div>
          </div>
        </div>

        <div id="realtimeUpdates"></div>

        <div class="droplet-list" id="dropletList">
          <!-- Droplets will be rendered here -->
        </div>

        <div class="loading-more" id="loadingMore" style="display: none;">
          <div class="loading-spinner"></div>
          <div>Loading more droplets...</div>
        </div>

        <button class="load-more-btn" id="loadMoreBtn" style="display: none;">
          Load More Droplets
        </button>

        <div class="empty-state" id="emptyState" style="display: none;">
          <div class="icon">📝</div>
          <h3>No droplets found</h3>
          <p>Be the first to share something with your university community!</p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById('searchInput');
    const filterBtn = this.shadowRoot.getElementById('filterBtn');
    const filterPanel = this.shadowRoot.getElementById('filterPanel');
    const loadMoreBtn = this.shadowRoot.getElementById('loadMoreBtn');

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 300);
    });

    // Filter panel toggle
    filterBtn.addEventListener('click', () => {
      filterPanel.classList.toggle('show');
      filterBtn.classList.toggle('active');
    });

    // Load more
    loadMoreBtn.addEventListener('click', () => {
      this.loadMoreDroplets();
    });

    // Infinite scroll
    this.shadowRoot.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.shadowRoot.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100 && !this.isLoading && this.hasMore) {
        this.loadMoreDroplets();
      }
    });
  }

  async loadInitialFeed() {
    try {
      this.isLoading = true;
      this.showLoading();

      const response = await fetch('/api/v1/droplets', {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load feed');
      }

      const data = await response.json();
      this.droplets = data.droplets;
      this.hasMore = data.hasMore;
      this.currentOffset += this.droplets.length;

      this.renderDroplets();
      this.hideLoading();
      this.updateLoadMoreButton();

    } catch (error) {
      console.error('Error loading feed:', error);
      this.showError('Failed to load feed');
      this.hideLoading();
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreDroplets() {
    if (this.isLoading || !this.hasMore) return;

    try {
      this.isLoading = true;
      this.showLoadingMore();

      const params = new URLSearchParams({
        limit: this.currentLimit,
        offset: this.currentOffset
      });

      if (this.searchQuery) {
        params.append('q', this.searchQuery);
      }

      if (this.filterBubbles.length > 0) {
        params.append('bubbles', this.filterBubbles.join(','));
      }

      const response = await fetch(`/api/v1/droplets?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load more droplets');
      }

      const data = await response.json();
      const newDroplets = data.droplets;
      
      if (newDroplets.length > 0) {
        this.droplets.push(...newDroplets);
        this.currentOffset += newDroplets.length;
        this.hasMore = data.hasMore;
        
        // Append new droplets to existing list
        this.appendDroplets(newDroplets);
      }

      this.hideLoadingMore();
      this.updateLoadMoreButton();

    } catch (error) {
      console.error('Error loading more droplets:', error);
      this.showError('Failed to load more droplets');
      this.hideLoadingMore();
    } finally {
      this.isLoading = false;
    }
  }

  async handleSearch(query) {
    this.searchQuery = query.trim();
    this.currentOffset = 0;
    this.droplets = [];

    try {
      this.showLoading();

      const params = new URLSearchParams({
        limit: this.currentLimit,
        offset: 0
      });

      if (this.searchQuery) {
        params.append('q', this.searchQuery);
      }

      if (this.filterBubbles.length > 0) {
        params.append('bubbles', this.filterBubbles.join(','));
      }

      const response = await fetch(`/api/v1/droplets/search?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      this.droplets = data.droplets;
      this.hasMore = data.hasMore;
      this.currentOffset = this.droplets.length;

      this.renderDroplets();
      this.hideLoading();
      this.updateLoadMoreButton();

    } catch (error) {
      console.error('Error searching droplets:', error);
      this.showError('Search failed');
      this.hideLoading();
    }
  }

  renderDroplets() {
    const dropletList = this.shadowRoot.getElementById('dropletList');
    const emptyState = this.shadowRoot.getElementById('emptyState');

    if (this.droplets.length === 0) {
      dropletList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    dropletList.style.display = 'flex';
    emptyState.style.display = 'none';

    dropletList.innerHTML = this.droplets.map(droplet => this.createDropletHTML(droplet)).join('');

    // Add event listeners to droplet actions
    this.attachDropletEventListeners();
  }

  appendDroplets(newDroplets) {
    const dropletList = this.shadowRoot.getElementById('dropletList');
    
    newDroplets.forEach(droplet => {
      const dropletElement = document.createElement('div');
      dropletElement.innerHTML = this.createDropletHTML(droplet);
      dropletList.appendChild(dropletElement.firstElementChild);
    });

    this.attachDropletEventListeners();
  }

  createDropletHTML(droplet) {
    const timeAgo = this.formatTimeAgo(new Date(droplet.createdAt));
    const visibilityClass = `visibility-${droplet.visibility}`;
    const visibilityIcon = this.getVisibilityIcon(droplet.visibility);

    return `
      <div class="droplet-item" data-droplet-id="${droplet.id}">
        <div class="droplet-header">
          <div class="droplet-avatar">
            ${droplet.author?.avatarUrl 
              ? `<img src="${droplet.author.avatarUrl}" alt="${droplet.author.displayName}">`
              : droplet.author?.displayName?.charAt(0).toUpperCase() || '?'
            }
          </div>
          <div class="droplet-meta">
            <div>
              <span class="droplet-author">${droplet.author?.displayName || 'Unknown'}</span>
              <span class="droplet-role">${droplet.author?.role || ''}</span>
              <span class="droplet-visibility ${visibilityClass}">${visibilityIcon} ${droplet.visibility}</span>
            </div>
            <div class="droplet-time">${timeAgo}</div>
          </div>
        </div>

        <div class="droplet-content">${this.formatContent(droplet.content)}</div>

        ${droplet.bubbles && droplet.bubbles.length > 0 ? `
          <div class="droplet-bubbles">
            ${droplet.bubbles.map(bubble => `
              <a href="#" class="bubble-tag" data-bubble="${bubble}">${bubble}</a>
            `).join('')}
          </div>
        ` : ''}

        ${droplet.mediaAttachments && droplet.mediaAttachments.length > 0 ? `
          <div class="droplet-media">
            ${droplet.mediaAttachments.map(media => this.createMediaHTML(media)).join('')}
          </div>
        ` : ''}

        <div class="droplet-actions">
          <button class="action-btn upvote-btn" data-droplet-id="${droplet.id}" data-action="upvote">
            👍 <span class="count">${droplet.interactions?.upvotes || 0}</span>
          </button>
          <button class="action-btn comment-btn" data-droplet-id="${droplet.id}" data-action="comment">
            💬 <span class="count">${droplet.interactions?.comments || 0}</span>
          </button>
          <button class="action-btn share-btn" data-droplet-id="${droplet.id}" data-action="share">
            🔄 <span class="count">${droplet.interactions?.shares || 0}</span>
          </button>
          <button class="action-btn bookmark-btn" data-droplet-id="${droplet.id}" data-action="bookmark">
            🔖 <span class="count">${droplet.interactions?.bookmarks || 0}</span>
          </button>
        </div>
      </div>
    `;
  }

  createMediaHTML(media) {
    switch (media.type) {
      case 'image':
        return `
          <div class="media-item">
            <img src="${media.url}" alt="${media.url}" loading="lazy">
          </div>
        `;
      case 'video':
        return `
          <div class="media-item video">
            <video controls style="width: 100%; height: 150px; object-fit: cover;">
              <source src="${media.url}" type="${media.mimeType}">
            </video>
          </div>
        `;
      case 'document':
        return `
          <a href="${media.url}" class="media-item document" target="_blank">
            <div class="icon">📄</div>
            <div>${media.url.split('/').pop()}</div>
          </a>
        `;
      default:
        return '';
    }
  }

  attachDropletEventListeners() {
    // Bubble tag clicks
    this.shadowRoot.querySelectorAll('.bubble-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const bubble = e.target.dataset.bubble;
        this.filterByBubble(bubble);
      });
    });

    // Action buttons
    this.shadowRoot.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dropletId = e.currentTarget.dataset.dropletId;
        const action = e.currentTarget.dataset.action;
        this.handleDropletAction(dropletId, action, e.currentTarget);
      });
    });

    // Media items
    this.shadowRoot.querySelectorAll('.media-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.openMediaModal(e.currentTarget);
      });
    });
  }

  async handleDropletAction(dropletId, action, button) {
    try {
      // Toggle active state for upvote/bookmark
      if (action === 'upvote' || action === 'bookmark') {
        button.classList.toggle('active');
        const countSpan = button.querySelector('.count');
        const currentCount = parseInt(countSpan.textContent);
        countSpan.textContent = button.classList.contains('active') ? currentCount + 1 : currentCount - 1;
      }

      const response = await fetch(`/api/v1/droplets/${dropletId}/interact`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: action })
      });

      if (!response.ok) {
        // Revert UI change on error
        if (action === 'upvote' || action === 'bookmark') {
          button.classList.toggle('active');
          const countSpan = button.querySelector('.count');
          const currentCount = parseInt(countSpan.textContent);
          countSpan.textContent = button.classList.contains('active') ? currentCount + 1 : currentCount - 1;
        }
        throw new Error('Failed to perform action');
      }

      // Handle different actions
      switch (action) {
        case 'share':
          this.showShareDialog(dropletId);
          break;
        case 'comment':
          this.openCommentDialog(dropletId);
          break;
      }

    } catch (error) {
      console.error(`Error performing ${action} on droplet ${dropletId}:`, error);
      this.showError('Failed to perform action');
    }
  }

  async initializeRealtime() {
    try {
      // Initialize Socket.io connection
      this.socket = io();
      
      this.socket.on('connect', () => {
        this.realtimeEnabled = true;
        this.showRealtimeIndicator();
        
        // Subscribe to feed updates
        this.socket.emit('feed:subscribe');
      });

      this.socket.on('droplet:created', (data) => {
        this.handleRealtimeDropletCreated(data);
      });

      this.socket.on('droplet:updated', (data) => {
        this.handleRealtimeDropletUpdated(data);
      });

      this.socket.on('droplet:deleted', (data) => {
        this.handleRealtimeDropletDeleted(data);
      });

      this.socket.on('feed:updated', (data) => {
        this.handleFeedUpdate(data);
      });

      this.socket.on('disconnect', () => {
        this.realtimeEnabled = false;
        this.hideRealtimeIndicator();
      });

    } catch (error) {
      console.error('Error initializing realtime:', error);
      this.realtimeEnabled = false;
    }
  }

  handleRealtimeDropletCreated(data) {
    // Show notification for new droplet
    this.showRealtimeUpdate('New droplet posted!', data.droplet);
    
    // Add to beginning of feed if not already present
    if (!this.droplets.some(d => d.id === data.droplet.id)) {
      this.droplets.unshift(data.droplet);
      this.renderDroplets();
    }
  }

  handleRealtimeDropletUpdated(data) {
    const index = this.droplets.findIndex(d => d.id === data.droplet.id);
    if (index !== -1) {
      this.droplets[index] = data.droplet;
      this.renderDroplets();
    }
  }

  handleRealtimeDropletDeleted(data) {
    this.droplets = this.droplets.filter(d => d.id !== data.dropletId);
    this.renderDroplets();
  }

  handleFeedUpdate(data) {
    // Refresh feed with new data
    this.droplets = data.feed;
    this.renderDroplets();
  }

  showRealtimeIndicator() {
    const indicator = this.shadowRoot.getElementById('realtimeIndicator');
    indicator.style.display = 'flex';
  }

  hideRealtimeIndicator() {
    const indicator = this.shadowRoot.getElementById('realtimeIndicator');
    indicator.style.display = 'none';
  }

  showRealtimeUpdate(message, droplet) {
    const updatesContainer = this.shadowRoot.getElementById('realtimeUpdates');
    const updateElement = document.createElement('div');
    updateElement.className = 'realtime-update';
    updateElement.innerHTML = `
      <span>🔔</span>
      <span>${message}</span>
    `;
    
    updatesContainer.appendChild(updateElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (updateElement.parentNode) {
        updateElement.parentNode.removeChild(updateElement);
      }
    }, 5000);
  }

  formatContent(content) {
    // Basic content formatting
    let formatted = content
      .replace(/@\w+/g, '<span style="color: #1976d2; font-weight: 500;">$&</span>')
      .replace(/#\w+/g, '<span style="color: #1976d2;">$&</span>')
      .replace(/\n/g, '<br>');

    return formatted;
  }

  formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  getVisibilityIcon(visibility) {
    const icons = {
      public: '🌐',
      university: '🎓',
      bubble: '🫧',
      private: '🔒'
    };
    return icons[visibility] || '📝';
  }

  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  showLoading() {
    const dropletList = this.shadowRoot.getElementById('dropletList');
    dropletList.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div class="loading-spinner"></div>
        <div>Loading feed...</div>
      </div>
    `;
  }

  hideLoading() {
    // Loading is hidden when droplets are rendered
  }

  showLoadingMore() {
    const loadingMore = this.shadowRoot.getElementById('loadingMore');
    loadingMore.style.display = 'block';
  }

  hideLoadingMore() {
    const loadingMore = this.shadowRoot.getElementById('loadingMore');
    loadingMore.style.display = 'none';
  }

  updateLoadMoreButton() {
    const loadMoreBtn = this.shadowRoot.getElementById('loadMoreBtn');
    loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
  }

  showError(message) {
    // Simple error display
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  showShareDialog(dropletId) {
    // Simple share implementation
    const url = `${window.location.origin}/droplets/${dropletId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this droplet',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      this.showError('Link copied to clipboard!');
    }
  }

  openCommentDialog(dropletId) {
    // This would open a comment dialog - to be implemented in User Story 4
    this.showError('Comments coming soon!');
  }

  openMediaModal(mediaElement) {
    // Simple media modal - could be enhanced
    const img = mediaElement.querySelector('img');
    if (img) {
      window.open(img.src, '_blank');
    }
  }

  filterByBubble(bubble) {
    if (!this.filterBubbles.includes(bubble)) {
      this.filterBubbles.push(bubble);
    }
    this.handleSearch(this.searchQuery);
  }

  disconnectedCallback() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Register the custom element
customElements.define('feed-display', FeedDisplay);

export default FeedDisplay;