/**
 * DropletCreation Component
 * Handles creating new droplets with text content and media attachments
 */
class DropletCreation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.user = null;
    this.isSubmitting = false;
    this.mediaFiles = [];
    this.mentionedUsers = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
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

        .droplet-creator {
          padding: 20px;
        }

        .user-info {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1976d2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 12px;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #333;
        }

        .user-role {
          font-size: 0.85rem;
          color: #666;
        }

        .content-input {
          width: 100%;
          min-height: 100px;
          padding: 15px;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          resize: vertical;
          margin-bottom: 15px;
          box-sizing: border-box;
        }

        .content-input:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
        }

        .content-input::placeholder {
          color: #999;
        }

        .bubbles-section {
          margin-bottom: 15px;
        }

        .bubbles-label {
          display: block;
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 8px;
        }

        .bubbles-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          box-sizing: border-box;
        }

        .bubbles-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .bubble-suggestion {
          background: #f5f5f5;
          border: 1px solid #e1e5e9;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .bubble-suggestion:hover {
          background: #1976d2;
          color: white;
        }

        .media-section {
          margin-bottom: 15px;
        }

        .media-upload {
          border: 2px dashed #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .media-upload:hover {
          border-color: #1976d2;
          background: #f9fbff;
        }

        .media-upload.dragging {
          border-color: #1976d2;
          background: #e3f2fd;
        }

        .media-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }

        .media-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .media-item img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          display: block;
        }

        .media-item .remove-media {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .mentions-section {
          margin-bottom: 15px;
        }

        .mentions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .mention-chip {
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 16px;
          padding: 4px 12px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mention-chip .remove-mention {
          background: none;
          border: none;
          color: #1976d2;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .visibility-section {
          margin-bottom: 15px;
        }

        .visibility-select {
          width: 100%;
          padding: 8px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          box-sizing: border-box;
        }

        .actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .char-count {
          font-size: 0.85rem;
          color: ${this.getCharCountColor()};
        }

        .buttons {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1565c0;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #666;
        }

        .btn-secondary:hover {
          background: #e1e5e9;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 0.9rem;
        }

        .loading {
          display: none;
          text-align: center;
          padding: 20px;
        }

        .loading.show {
          display: block;
        }

        .spinner {
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

        .hidden {
          display: none;
        }
      </style>

      <div class="droplet-creator">
        <div class="user-info">
          <div class="user-avatar" id="userAvatar">?</div>
          <div class="user-details">
            <div class="user-name" id="userName">Loading...</div>
            <div class="user-role" id="userRole">Student</div>
          </div>
        </div>

        <div class="error-message hidden" id="errorMessage"></div>

        <textarea 
          class="content-input" 
          id="contentInput"
          placeholder="Share your thoughts, research, or announcements..."
          maxlength="5000"
        ></textarea>

        <div class="mentions-section hidden" id="mentionsSection">
          <div class="mentions-list" id="mentionsList"></div>
        </div>

        <div class="bubbles-section">
          <label class="bubbles-label">Topics (hashtags) - Optional</label>
          <input 
            type="text" 
            class="bubbles-input" 
            id="bubblesInput"
            placeholder="#computer-science #research #study-group"
          >
          <div class="bubbles-suggestions">
            <div class="bubble-suggestion" data-bubble="#computer-science">#computer-science</div>
            <div class="bubble-suggestion" data-bubble="#research">#research</div>
            <div class="bubble-suggestion" data-bubble="#study-group">#study-group</div>
            <div class="bubble-suggestion" data-bubble="#announcements">#announcements</div>
            <div class="bubble-suggestion" data-bubble="#help">#help</div>
          </div>
        </div>

        <div class="media-section">
          <div class="media-upload" id="mediaUpload">
            <div>📎 Click to upload or drag & drop</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">
              Images, videos, documents (max 10MB per file)
            </div>
          </div>
          <input type="file" id="fileInput" multiple accept="image/*,video/*,application/pdf" style="display: none;">
          <div class="media-preview" id="mediaPreview"></div>
        </div>

        <div class="visibility-section">
          <select class="visibility-select" id="visibilitySelect">
            <option value="university">🎓 University-wide</option>
            <option value="public">🌐 Public</option>
            <option value="bubble">🫧 Bubble-only</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>

        <div class="actions">
          <div class="char-count" id="charCount">0 / 5000</div>
          <div class="buttons">
            <button class="btn btn-secondary" id="cancelBtn" style="display: none;">Cancel</button>
            <button class="btn btn-primary" id="postBtn">Post Droplet</button>
          </div>
        </div>

        <div class="loading" id="loading">
          <div class="spinner"></div>
          <div>Creating droplet...</div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const contentInput = this.shadowRoot.getElementById('contentInput');
    const bubblesInput = this.shadowRoot.getElementById('bubblesInput');
    const mediaUpload = this.shadowRoot.getElementById('mediaUpload');
    const fileInput = this.shadowRoot.getElementById('fileInput');
    const postBtn = this.shadowRoot.getElementById('postBtn');
    const cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    const visibilitySelect = this.shadowRoot.getElementById('visibilitySelect');

    // Content input events
    contentInput.addEventListener('input', () => {
      this.updateCharCount();
      this.detectMentions();
    });

    // Bubble suggestions
    this.shadowRoot.querySelectorAll('.bubble-suggestion').forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        const bubble = suggestion.dataset.bubble;
        if (!bubblesInput.value.includes(bubble)) {
          bubblesInput.value += (bubblesInput.value ? ' ' : '') + bubble;
        }
      });
    });

    // File upload
    mediaUpload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    // Drag and drop
    mediaUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      mediaUpload.classList.add('dragging');
    });

    mediaUpload.addEventListener('dragleave', () => {
      mediaUpload.classList.remove('dragging');
    });

    mediaUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      mediaUpload.classList.remove('dragging');
      this.handleFileSelect(e.dataTransfer.files);
    });

    // Form submission
    postBtn.addEventListener('click', () => this.handleSubmit());
    cancelBtn.addEventListener('click', () => this.handleCancel());

    // Visibility change
    visibilitySelect.addEventListener('change', () => {
      this.handleVisibilityChange(visibilitySelect.value);
    });
  }

  async loadUserInfo() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.showError('Please log in to create droplets');
        return;
      }

      const response = await fetch('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load user info');
      }

      const user = await response.json();
      this.user = user;
      this.updateUserDisplay(user);
    } catch (error) {
      console.error('Error loading user info:', error);
      this.showError('Failed to load user information');
    }
  }

  updateUserDisplay(user) {
    const userAvatar = this.shadowRoot.getElementById('userAvatar');
    const userName = this.shadowRoot.getElementById('userName');
    const userRole = this.shadowRoot.getElementById('userRole');

    userName.textContent = user.displayName || user.username;
    userRole.textContent = user.role || 'Student';

    if (user.avatarUrl) {
      userAvatar.style.backgroundImage = `url(${user.avatarUrl})`;
      userAvatar.style.backgroundSize = 'cover';
      userAvatar.textContent = '';
    } else {
      userAvatar.textContent = (user.displayName || user.username).charAt(0).toUpperCase();
    }
  }

  updateCharCount() {
    const contentInput = this.shadowRoot.getElementById('contentInput');
    const charCount = this.shadowRoot.getElementById('charCount');
    const count = contentInput.value.length;
    
    charCount.textContent = `${count} / 5000`;
    charCount.style.color = this.getCharCountColor(count);
  }

  getCharCountColor(count = 0) {
    if (count > 4500) return '#f44336';
    if (count > 4000) return '#ff9800';
    return '#666';
  }

  detectMentions() {
    const contentInput = this.shadowRoot.getElementById('contentInput');
    const text = contentInput.value;
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex) || [];
    
    this.mentionedUsers = [...new Set(mentions)];
    this.updateMentionsDisplay();
  }

  updateMentionsDisplay() {
    const mentionsSection = this.shadowRoot.getElementById('mentionsSection');
    const mentionsList = this.shadowRoot.getElementById('mentionsList');

    if (this.mentionedUsers.length === 0) {
      mentionsSection.classList.add('hidden');
      return;
    }

    mentionsSection.classList.remove('hidden');
    mentionsList.innerHTML = this.mentionedUsers.map(mention => `
      <div class="mention-chip">
        ${mention}
        <button class="remove-mention" data-mention="${mention}">×</button>
      </div>
    `).join('');

    // Add remove handlers
    mentionsList.querySelectorAll('.remove-mention').forEach(btn => {
      btn.addEventListener('click', () => {
        const mention = btn.dataset.mention;
        this.removeMention(mention);
      });
    });
  }

  removeMention(mention) {
    const contentInput = this.shadowRoot.getElementById('contentInput');
    contentInput.value = contentInput.value.replace(new RegExp(mention.replace('@', '\\@'), 'g'), '');
    this.detectMentions();
  }

  handleFileSelect(files) {
    Array.from(files).forEach(file => {
      if (this.mediaFiles.length >= 10) {
        this.showError('Maximum 10 files allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        this.showError(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.addMediaPreview({
            file,
            url: e.target.result,
            name: file.name,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      } else {
        this.addMediaPreview({
          file,
          name: file.name,
          type: file.type
        });
      }
    });
  }

  addMediaPreview(mediaItem) {
    this.mediaFiles.push(mediaItem);
    this.updateMediaPreview();
  }

  updateMediaPreview() {
    const mediaPreview = this.shadowRoot.getElementById('mediaPreview');
    
    mediaPreview.innerHTML = this.mediaFiles.map((item, index) => `
      <div class="media-item">
        ${item.url ? `<img src="${item.url}" alt="${item.name}">` : `<div>${item.name}</div>`}
        <button class="remove-media" data-index="${index}">×</button>
      </div>
    `).join('');

    // Add remove handlers
    mediaPreview.querySelectorAll('.remove-media').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.removeMedia(index);
      });
    });
  }

  removeMedia(index) {
    this.mediaFiles.splice(index, 1);
    this.updateMediaPreview();
  }

  handleVisibilityChange(visibility) {
    // Show/hide additional options based on visibility
    const bubblesInput = this.shadowRoot.getElementById('bubblesInput');
    const bubblesSection = this.shadowRoot.querySelector('.bubbles-section');
    
    if (visibility === 'bubble') {
      bubblesSection.style.display = 'block';
      bubblesInput.required = true;
    } else {
      bubblesSection.style.display = 'block'; // Keep visible but optional
      bubblesInput.required = false;
    }
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    const contentInput = this.shadowRoot.getElementById('contentInput');
    const bubblesInput = this.shadowRoot.getElementById('bubblesInput');
    const visibilitySelect = this.shadowRoot.getElementById('visibilitySelect');
    const postBtn = this.shadowRoot.getElementById('postBtn');
    const loading = this.shadowRoot.getElementById('loading');

    // Validation
    const content = contentInput.value.trim();
    if (!content) {
      this.showError('Please enter some content');
      return;
    }

    if (content.length < 3) {
      this.showError('Content must be at least 3 characters long');
      return;
    }

    try {
      this.isSubmitting = true;
      postBtn.disabled = true;
      loading.classList.add('show');

      // Parse bubbles
      const bubblesText = bubblesInput.value.trim();
      const bubbles = bubblesText ? bubblesText.split(/\s+/).filter(b => b.startsWith('#')) : [];

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibilitySelect.value);
      
      if (bubbles.length > 0) {
        bubbles.forEach(bubble => formData.append('bubbles[]', bubble));
      }

      // Add media files
      this.mediaFiles.forEach(mediaItem => {
        formData.append('files', mediaItem.file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/droplets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create droplet');
      }

      const result = await response.json();
      
      // Reset form
      this.resetForm();
      
      // Emit success event
      this.dispatchEvent(new CustomEvent('droplet-created', {
        detail: { droplet: result.droplet },
        bubbles: true
      }));

      // Show success message
      this.showSuccess('Droplet created successfully!');

    } catch (error) {
      console.error('Error creating droplet:', error);
      this.showError(error.message || 'Failed to create droplet');
    } finally {
      this.isSubmitting = false;
      postBtn.disabled = false;
      loading.classList.remove('show');
    }
  }

  handleCancel() {
    this.resetForm();
    this.dispatchEvent(new CustomEvent('droplet-cancelled', { bubbles: true }));
  }

  resetForm() {
    const contentInput = this.shadowRoot.getElementById('contentInput');
    const bubblesInput = this.shadowRoot.getElementById('bubblesInput');
    const visibilitySelect = this.shadowRoot.getElementById('visibilitySelect');
    const errorMessage = this.shadowRoot.getElementById('errorMessage');

    contentInput.value = '';
    bubblesInput.value = '';
    visibilitySelect.value = 'university';
    this.mediaFiles = [];
    this.mentionedUsers = [];
    
    this.updateCharCount();
    this.updateMentionsDisplay();
    this.updateMediaPreview();
    errorMessage.classList.add('hidden');
  }

  showError(message) {
    const errorMessage = this.shadowRoot.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }

  showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4caf50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 3000);
  }
}

// Register the custom element
customElements.define('droplet-creation', DropletCreation);

export default DropletCreation;