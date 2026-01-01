const Droplet = require('../models/droplet');
const MediaAttachment = require('../models/media');
const Interaction = require('../models/interaction');
const { emitToBubble, emitToUser, broadcastEvent, events } = require('../services/realtime');
const { NotFoundError, ValidationError } = require('../middleware/errors');

class DropletService {
  // Create a new droplet
  static async create(userId, dropletData, mediaFiles = []) {
    try {
      // Validate user can create droplets
      // This could include rate limiting, content moderation, etc.
      
      // Process media files if any
      const mediaAttachments = [];
      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const mediaAttachment = await MediaAttachment.create({
            ...file,
            dropletId: 'temp' // Will be updated after droplet creation
          });
          mediaAttachments.push(mediaAttachment);
        }
      }

      // Create droplet with media attachments
      const droplet = await Droplet.create({
        ...dropletData,
        authorId: userId,
        mediaAttachments: mediaAttachments.map(att => att.toJSON())
      });

      // Update media attachments with droplet ID
      if (mediaAttachments.length > 0) {
        for (const attachment of mediaAttachments) {
          await MediaAttachment.update(attachment.id, { dropletId: droplet.id });
        }
      }

      // Emit real-time events
      await DropletService.broadcastDropletCreated(droplet);

      return droplet;
    } catch (error) {
      throw error;
    }
  }

  // Get user's personalized feed
  static async getUserFeed(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, bubbles } = options;

      // Build query for personalized feed
      // Include droplets from:
      // 1. User's joined bubbles
      // 2. User's own droplets
      // 3. Public droplets
      // 4. University-wide droplets
      
      const feedOptions = {
        limit,
        offset,
        userId,
        visibility: ['public', 'university'],
        bubbles,
        includeReplies: true
      };

      const droplets = await Droplet.findMany(feedOptions);
      
      // Add author information
      for (const droplet of droplets) {
        droplet.author = await DropletService.getDropletAuthor(droplet.authorId);
      }

      return droplets;
    } catch (error) {
      throw error;
    }
  }

  // Get single droplet with full details
  static async getDroplet(dropletId, userId = null) {
    try {
      const droplet = await Droplet.findById(dropletId);
      
      // Check visibility permissions
      if (!DropletService.canUserViewDroplet(droplet, userId)) {
        throw new ValidationError('You do not have permission to view this droplet');
      }

      // Add author information
      droplet.author = await DropletService.getDropletAuthor(droplet.authorId);

      // Add media attachments
      droplet.mediaAttachments = await MediaAttachment.findByDropletId(dropletId);

      // Add interaction summary
      droplet.interactionSummary = await Interaction.getDropletSummary(dropletId);

      // Add replies
      droplet.replies = await Droplet.getReplies(dropletId, { limit: 10 });

      return droplet;
    } catch (error) {
      throw error;
    }
  }

  // Update a droplet
  static async updateDroplet(dropletId, userId, updates) {
    try {
      // Get existing droplet and check ownership
      const existingDroplet = await Droplet.findById(dropletId);
      
      if (existingDroplet.authorId !== userId) {
        throw new ValidationError('You can only edit your own droplets');
      }

      // Check if droplet is too old to edit (24 hours)
      const createdAt = new Date(existingDroplet.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 24) {
        throw new ValidationError('Droplets can only be edited within 24 hours of creation');
      }

      const updatedDroplet = await Droplet.update(dropletId, updates);
      
      // Emit real-time event
      await DropletService.broadcastDropletUpdated(updatedDroplet);

      return updatedDroplet;
    } catch (error) {
      throw error;
    }
  }

  // Delete a droplet
  static async deleteDroplet(dropletId, userId) {
    try {
      // Droplet model handles ownership check and soft delete
      await Droplet.delete(dropletId, userId);
      
      // Emit real-time event
      await DropletService.broadcastDropletDeleted(dropletId);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Search droplets
  static async searchDroplets(userId, searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0, bubbles, visibility } = options;

      // Search with visibility filtering
      const searchOptions = {
        limit,
        offset,
        userId, // For personalized results
        bubbles,
        visibility: visibility || ['public', 'university']
      };

      const droplets = await Droplet.search(searchTerm, searchOptions);
      
      // Add author information
      for (const droplet of droplets) {
        droplet.author = await DropletService.getDropletAuthor(droplet.authorId);
      }

      return droplets;
    } catch (error) {
      throw error;
    }
  }

  // Get trending droplets
  static async getTrendingDroplets(options = {}) {
    try {
      const { limit = 20, offset = 0, timeWindow = '24h' } = options;

      // Calculate time window
      let timeCondition = '';
      if (timeWindow === '24h') {
        timeCondition = "AND datetime('now', '-24 hours') <= createdAt";
      } else if (timeWindow === '7d') {
        timeCondition = "AND datetime('now', '-7 days') <= createdAt";
      } else if (timeWindow === '30d') {
        timeCondition = "AND datetime('now', '-30 days') <= createdAt";
      }

      const trendingQuery = `
        SELECT d.*, 
               (json_extract(d.interactions, '$.upvotes') * 2 + 
                json_extract(d.interactions, '$.comments') * 1.5 + 
                json_extract(d.interactions, '$.shares') * 1) as trend_score
        FROM droplets d
        WHERE d.deletedAt IS NULL 
          AND d.visibility IN ('public', 'university')
          ${timeCondition}
        ORDER BY trend_score DESC, d.createdAt DESC
        LIMIT ? OFFSET ?
      `;

      const rows = await db.all(trendingQuery, [limit, offset]);
      
      const droplets = rows.map(row => Droplet.parseRow(row));
      
      // Add author information
      for (const droplet of droplets) {
        droplet.author = await DropletService.getDropletAuthor(droplet.authorId);
      }

      return droplets;
    } catch (error) {
      throw error;
    }
  }

  // Check if user can view droplet
  static canUserViewDroplet(droplet, userId) {
    if (!userId) {
      return droplet.visibility === 'public';
    }

    // Author can always view their own droplets
    if (droplet.authorId === userId) {
      return true;
    }

    // Check visibility
    switch (droplet.visibility) {
      case 'public':
        return true;
      case 'university':
        return true; // Assuming all authenticated users are from same university
      case 'bubble':
        // Check if user is in any of the droplet's bubbles
        // This would require checking bubble membership
        return true; // Simplified for now
      case 'private':
        return droplet.authorId === userId;
      default:
        return false;
    }
  }

  // Get droplet author information
  static async getDropletAuthor(authorId) {
    try {
      const User = require('../models/user');
      const author = await User.findById(authorId);
      
      return author ? author.toJSON() : null;
    } catch (error) {
      console.error('Error getting droplet author:', error);
      return null;
    }
  }

  // Real-time event broadcasters
  static async broadcastDropletCreated(droplet) {
    try {
      // Broadcast to user's followers (not implemented yet)
      // Broadcast to droplet's bubbles
      if (droplet.bubbles && droplet.bubbles.length > 0) {
        for (const bubbleId of droplet.bubbles) {
          emitToBubble(bubbleId, events.DROPLET_CREATED, {
            droplet: droplet.toJSON(true),
            bubbleId
          });
        }
      }

      // Broadcast to author
      emitToUser(droplet.authorId, events.DROPLET_CREATED, {
        droplet: droplet.toJSON(true)
      });

      // Global broadcast for public/university droplets
      if (['public', 'university'].includes(droplet.visibility)) {
        broadcastEvent(events.DROPLET_CREATED, {
          droplet: droplet.toJSON(false)
        });
      }
    } catch (error) {
      console.error('Error broadcasting droplet created:', error);
    }
  }

  static async broadcastDropletUpdated(droplet) {
    try {
      // Broadcast to droplet's bubbles
      if (droplet.bubbles && droplet.bubbles.length > 0) {
        for (const bubbleId of droplet.bubbles) {
          emitToBubble(bubbleId, events.DROPLET_UPDATED, {
            droplet: droplet.toJSON(true),
            bubbleId
          });
        }
      }

      // Broadcast to author
      emitToUser(droplet.authorId, events.DROPLET_UPDATED, {
        droplet: droplet.toJSON(true)
      });
    } catch (error) {
      console.error('Error broadcasting droplet updated:', error);
    }
  }

  static async broadcastDropletDeleted(dropletId) {
    try {
      // Broadcast to all connected users
      broadcastEvent(events.DROPLET_DELETED, {
        dropletId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting droplet deleted:', error);
    }
  }

  // Content moderation helpers
  static async validateDropletContent(content, userId) {
    try {
      // Check for prohibited content
      const prohibitedWords = ['spam', 'abuse', 'hate']; // Would be configurable
      
      const contentLower = content.toLowerCase();
      for (const word of prohibitedWords) {
        if (contentLower.includes(word)) {
          throw new ValidationError(`Content contains prohibited word: ${word}`);
        }
      }

      // Rate limiting check (simplified)
      const recentDroplets = await Droplet.findMany({
        authorId: userId,
        limit: 5
      });

      if (recentDroplets.length >= 5) {
        const lastDropletTime = new Date(recentDroplets[0].createdAt);
        const now = new Date();
        const minutesSinceLastDroplet = (now - lastDropletTime) / (1000 * 60);
        
        if (minutesSinceLastDroplet < 5) {
          throw new ValidationError('Please wait before posting another droplet');
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_droplets,
          SUM(json_extract(interactions, '$.upvotes')) as total_upvotes,
          SUM(json_extract(interactions, '$.comments')) as total_comments,
          SUM(json_extract(interactions, '$.shares')) as total_shares,
          COUNT(CASE WHEN replyToId IS NULL THEN 1 END) as original_droplets,
          COUNT(CASE WHEN replyToId IS NOT NULL THEN 1 END) as reply_droplets
        FROM droplets 
        WHERE authorId = ? AND deletedAt IS NULL
      `;

      const stats = await db.get(statsQuery, [userId]);
      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Get droplet replies
  static async getDropletReplies(dropletId, options = {}) {
    try {
      const { limit = 20, offset = 0, userId } = options;

      const replies = await Droplet.getReplies(dropletId, { limit, offset });
      
      // Add author information and check permissions
      for (const reply of replies) {
        reply.author = await DropletService.getDropletAuthor(reply.authorId);
        
        // Check if user can view this reply
        if (userId && !DropletService.canUserViewDroplet(reply, userId)) {
          // Filter out replies user can't see
          return replies.filter(r => DropletService.canUserViewDroplet(r, userId));
        }
      }

      return replies;
    } catch (error) {
      throw error;
    }
  }

  // Get user's droplets
  static async getUserDroplets(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, requestingUserId } = options;

      const userDroplets = await Droplet.findMany({
        authorId: userId,
        limit,
        offset,
        includeReplies: true
      });

      // Filter based on requesting user's permissions
      const visibleDroplets = userDroplets.filter(droplet => {
        return DropletService.canUserViewDroplet(droplet, requestingUserId);
      });

      // Add author information
      for (const droplet of visibleDroplets) {
        droplet.author = await DropletService.getDropletAuthor(droplet.authorId);
      }

      return visibleDroplets;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DropletService;