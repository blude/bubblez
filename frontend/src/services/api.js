class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token') || null;
    this.userId = localStorage.getItem('user_id') || null;
  }

  // Authentication methods
  setAuthToken(token, user) {
    this.token = token;
    this.userId = user.id;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // HTTP request helper
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Droplet operations
  async createDroplet(dropletData, mediaFiles = []) {
    const formData = new FormData();
    
    // Add text data
    Object.keys(dropletData).forEach(key => {
      if (Array.isArray(dropletData[key])) {
        dropletData[key].forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else {
        formData.append(key, dropletData[key]);
      }
    });

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return this.request('/droplets', {
      method: 'POST',
      body: formData,
      headers: {
        // Let browser set Content-Type for FormData
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      }
    });
  }

  async getDroplets(options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.bubbles) params.append('bubbles', options.bubbles.join(','));
    if (options.search) params.append('q', options.search);

    const query = params.toString();
    const endpoint = options.search ? '/droplets/search' : '/droplets';

    return this.request(`${endpoint}${query ? '?' + query : ''}`);
  }

  async getDroplet(dropletId) {
    return this.request(`/droplets/${dropletId}`);
  }

  async updateDroplet(dropletId, updates) {
    return this.request(`/droplets/${dropletId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteDroplet(dropletId) {
    return this.request(`/droplets/${dropletId}`, {
      method: 'DELETE'
    });
  }

  async getDropletReplies(dropletId, options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const query = params.toString();
    return this.request(`/droplets/${dropletId}/replies${query ? '?' + query : ''}`);
  }

  async interactWithDroplet(dropletId, interactionData) {
    return this.request(`/droplets/${dropletId}/interact`, {
      method: 'POST',
      body: JSON.stringify(interactionData)
    });
  }

  async getTrendingDroplets(options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.timeWindow) params.append('timeWindow', options.timeWindow);

    const query = params.toString();
    return this.request(`/droplets/trending${query ? '?' + query : ''}`);
  }

  // User operations
  async getCurrentUserProfile() {
    return this.request('/users');
  }

  async updateUserProfile(updates) {
    return this.request('/users', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async updatePassword(currentPassword, newPassword) {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
  }

  // Bubble operations
  async getBubbles(options = {}) {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.search) params.append('search', options.search);

    const query = params.toString();
    return this.request(`/bubbles${query ? '?' + query : ''}`);
  }

  async createBubble(bubbleData) {
    return this.request('/bubbles', {
      method: 'POST',
      body: JSON.stringify(bubbleData)
    });
  }

  async joinBubble(bubbleId) {
    return this.request(`/bubbles/${bubbleId}/join`, {
      method: 'POST'
    });
  }

  async leaveBubble(bubbleId) {
    return this.request(`/bubbles/${bubbleId}/leave`, {
      method: 'POST'
    });
  }

  // University system operations
  async getUniversitySystems() {
    return this.request('/university/systems');
  }

  async createUniversitySystem(systemData) {
    return this.request('/university/systems', {
      method: 'POST',
      body: JSON.stringify(systemData)
    });
  }

  // Search and suggestions
  async searchUsers(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (options.limit) params.append('limit', options.limit.toString());

    return this.request(`/users/search?${params.toString()}`);
  }

  async searchContent(query, options = {}) {
    return this.getDroplets({ search: query, ...options });
  }

  async getBubbleSuggestions(query) {
    return this.request('/bubbles/suggestions', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }

  // Authentication API
  async login(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      // Store auth token and user data
      if (response.token) {
        this.setAuthToken(response.token, response.user);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
      this.clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST'
      });

      if (response.token) {
        this.setAuthToken(response.token, this.getCurrentUser());
      }

      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Error handling helper
  handleApiError(error, context = '') {
    console.error(`API Error in ${context}:`, error);
    
    // Extract error message for user display
    let errorMessage = error.message || 'An unexpected error occurred';
    
    // Handle common error patterns
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      errorMessage = 'Please log in to continue';
      this.clearAuth(); // Clear invalid token
    }
    
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      errorMessage = 'You do not have permission to perform this action';
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      errorMessage = 'The requested resource was not found';
    }
    
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorMessage = 'Too many requests. Please try again later.';
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      errorMessage = 'Please check your input and try again.';
    }

    return errorMessage;
  }
}

// Export singleton instance
const apiClient = new ApiClient();

export default apiClient;