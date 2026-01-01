const { ValidationError } = require('../middleware/errors');

class ContentParser {
  // Parse content for hashtags, mentions, and other elements
  static parseContent(content) {
    const result = {
      hashtags: [],
      mentions: [],
      urls: [],
      cleanContent: content
    };

    // Extract hashtags (#word)
    const hashtagRegex = /#\w+/g;
    const hashtags = content.match(hashtagRegex) || [];
    result.hashtags = hashtags.map(tag => tag.substring(1).toLowerCase());

    // Extract mentions (@username)
    const mentionRegex = /@\w+/g;
    const mentions = content.match(mentionRegex) || [];
    result.mentions = mentions.map(mention => mention.substring(1).toLowerCase());

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex) || [];
    result.urls = urls;

    return result;
  }

  // Validate content according to platform rules
  static validateContent(content, options = {}) {
    const {
      maxLength = 5000,
      minLength = 1,
      allowEmpty = false,
      checkProhibited = true,
      checkSpam = true
    } = options;

    const errors = [];

    // Length validation
    if (content.length < minLength && !allowEmpty) {
      errors.push(`Content must be at least ${minLength} characters long`);
    }

    if (content.length > maxLength) {
      errors.push(`Content cannot exceed ${maxLength} characters`);
    }

    // Empty content check
    if (!content.trim() && !allowEmpty) {
      errors.push('Content cannot be empty');
    }

    // Prohibited content check
    if (checkProhibited) {
      const prohibitedWords = this.getProhibitedWords();
      const contentLower = content.toLowerCase();
      
      for (const word of prohibitedWords) {
        if (contentLower.includes(word)) {
          errors.push(`Content contains prohibited word: ${word}`);
        }
      }
    }

    // Spam detection
    if (checkSpam) {
      const spamIndicators = this.detectSpam(content);
      if (spamIndicators.length > 0) {
        errors.push(`Content appears to be spam: ${spamIndicators.join(', ')}`);
      }
    }

    // Hashtag validation
    const parsed = this.parseContent(content);
    if (parsed.hashtags.length > 5) {
      errors.push('Maximum 5 hashtags allowed per droplet');
    }

    // Mention validation
    if (parsed.mentions.length > 10) {
      errors.push('Maximum 10 mentions allowed per droplet');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join('; '));
    }

    return true;
  }

  // Get list of prohibited words
  static getProhibitedWords() {
    return [
      'spam',
      'abuse',
      'hate',
      'violence',
      'threat',
      'harassment',
      'discrimination',
      'racist',
      'sexist',
      'homophobic',
      'transphobic'
    ];
  }

  // Detect spam indicators
  static detectSpam(content) {
    const indicators = [];
    const contentLower = content.toLowerCase();

    // Check for excessive capitalization
    const uppercaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (uppercaseRatio > 0.5) {
      indicators.push('excessive capitalization');
    }

    // Check for repetitive characters
    if (/(.)\1{3,}/.test(content)) {
      indicators.push('repetitive characters');
    }

    // Check for excessive punctuation
    const punctuationCount = (content.match(/[!?.,;]/g) || []).length;
    if (punctuationCount > content.length * 0.2) {
      indicators.push('excessive punctuation');
    }

    // Check for common spam phrases
    const spamPhrases = [
      'click here',
      'free money',
      'limited offer',
      'act now',
      'guaranteed',
      'risk free',
      'no cost'
    ];

    for (const phrase of spamPhrases) {
      if (contentLower.includes(phrase)) {
        indicators.push(`spam phrase: ${phrase}`);
      }
    }

    return indicators;
  }

  // Sanitize content for display
  static sanitizeContent(content) {
    let sanitized = content;

    // Escape HTML
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Convert line breaks to <br>
    sanitized = sanitized.replace(/\n/g, '<br>');

    return sanitized;
  }

  // Format content with links, mentions, and hashtags
  static formatContent(content, options = {}) {
    const {
      linkify = true,
      mentionify = true,
      hashtagify = true,
      target = '_blank'
    } = options;

    let formatted = this.sanitizeContent(content);

    // Linkify URLs
    if (linkify) {
      const urlRegex = /https?:\/\/[^\s<]+/g;
      formatted = formatted.replace(urlRegex, (url) => {
        return `<a href="${url}" target="${target}" rel="noopener noreferrer">${url}</a>`;
      });
    }

    // Mentionify usernames
    if (mentionify) {
      const mentionRegex = /@(\w+)/g;
      formatted = formatted.replace(mentionRegex, (match, username) => {
        return `<a href="/users/${username}" class="mention">@${username}</a>`;
      });
    }

    // Hashtagify hashtags
    if (hashtagify) {
      const hashtagRegex = /#(\w+)/g;
      formatted = formatted.replace(hashtagRegex, (match, hashtag) => {
        return `<a href="/bubbles/${hashtag}" class="hashtag">#${hashtag}</a>`;
      });
    }

    return formatted;
  }

  // Extract preview text (for notifications, previews, etc.)
  static getPreviewText(content, maxLength = 100) {
    let preview = content;

    // Remove hashtags and mentions for cleaner preview
    preview = preview.replace(/#\w+/g, '');
    preview = preview.replace(/@\w+/g, '');

    // Remove URLs
    preview = preview.replace(/https?:\/\/[^\s]+/g, '[link]');

    // Trim and limit length
    preview = preview.trim();
    if (preview.length > maxLength) {
      preview = preview.substring(0, maxLength - 3) + '...';
    }

    return preview;
  }

  // Check if content is likely academic
  static isAcademicContent(content) {
    const academicKeywords = [
      'research', 'study', 'analysis', 'methodology', 'hypothesis',
      'experiment', 'data', 'results', 'conclusion', 'abstract',
      'literature', 'review', 'theory', 'framework', 'model',
      'algorithm', 'programming', 'code', 'development', 'design',
      'mathematics', 'physics', 'chemistry', 'biology', 'engineering',
      'computer science', 'information technology', 'software',
      'hardware', 'network', 'database', 'security', 'privacy',
      'ethics', 'philosophy', 'psychology', 'sociology', 'economics',
      'statistics', 'probability', 'calculus', 'algebra', 'geometry',
      'university', 'college', 'academic', 'scholar', 'professor',
      'student', 'assignment', 'homework', 'exam', 'test', 'quiz',
      'lecture', 'seminar', 'workshop', 'conference', 'paper',
      'thesis', 'dissertation', 'publication', 'journal', 'article'
    ];

    const contentLower = content.toLowerCase();
    const academicKeywordCount = academicKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;

    // Consider content academic if it has 3+ academic keywords
    return academicKeywordCount >= 3;
  }

  // Suggest relevant bubbles based on content
  static suggestBubbles(content, existingBubbles = []) {
    const parsed = this.parseContent(content);
    const suggestions = [];

    // Add existing hashtags as suggestions
    suggestions.push(...parsed.hashtags);

    // Add academic bubbles if content is academic
    if (this.isAcademicContent(content)) {
      suggestions.push('academics', 'research', 'studies');
    }

    // Add context-based suggestions
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('homework') || contentLower.includes('assignment')) {
      suggestions.push('homework', 'assignments');
    }
    
    if (contentLower.includes('exam') || contentLower.includes('test')) {
      suggestions.push('exams', 'tests');
    }
    
    if (contentLower.includes('lecture') || contentLower.includes('class')) {
      suggestions.push('lectures', 'classes');
    }

    // Remove duplicates and existing bubbles
    const uniqueSuggestions = [...new Set(suggestions)]
      .filter(bubble => !existingBubbles.includes(bubble))
      .slice(0, 5); // Limit to 5 suggestions

    return uniqueSuggestions;
  }

  // Extract topics from content using simple keyword analysis
  static extractTopics(content) {
    const topics = [];
    const contentLower = content.toLowerCase();

    // Topic keywords mapping
    const topicKeywords = {
      'computer-science': ['programming', 'code', 'algorithm', 'software', 'development', 'computer', 'technology'],
      'mathematics': ['math', 'calculus', 'algebra', 'geometry', 'statistics', 'probability', 'equation'],
      'physics': ['physics', 'quantum', 'mechanics', 'energy', 'force', 'motion', 'particle'],
      'chemistry': ['chemistry', 'chemical', 'molecule', 'reaction', 'element', 'compound'],
      'biology': ['biology', 'organism', 'cell', 'genetics', 'evolution', 'ecosystem'],
      'engineering': ['engineering', 'design', 'build', 'construct', 'manufacture', 'system'],
      'literature': ['book', 'novel', 'poem', 'story', 'author', 'writing', 'literature'],
      'history': ['history', 'historical', 'past', 'ancient', 'century', 'era', 'period'],
      'art': ['art', 'painting', 'sculpture', 'design', 'creative', 'aesthetic', 'visual'],
      'music': ['music', 'song', 'melody', 'rhythm', 'instrument', 'composer', 'performance']
    };

    // Score each topic based on keyword matches
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const score = keywords.filter(keyword => contentLower.includes(keyword)).length;
      if (score >= 2) { // Require at least 2 keyword matches
        topics.push({ topic, score });
      }
    }

    // Sort by score and return top topics
    return topics.sort((a, b) => b.score - a.score).slice(0, 3);
  }
}

module.exports = ContentParser;