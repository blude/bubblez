const Bubble = require('../models/bubble');
const { emitToBubble, emitToUser, broadcastEvent, events } = require('../services/realtime');
const { NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errors');
const { getDatabase } = require('../database/connection');

class BubbleService {
  // Create a new bubble
  static async create(userId, bubbleData) {
    try {
      const bubble = await Bubble.create({
        ...bubbleData,
        creatorId: userId,
        universityId: bubbleData.universityId || 'default'
      });

      // Automatically add creator as a member
      await Bubble.addMember(bubble.id, userId);

      // Emit real-time events
      await BubbleService.broadcastBubbleCreated(bubble);

      return bubble;
    } catch (error) {
      throw error;
    }
  }

  // Get bubble by ID
  static async getBubble(bubbleId, userId = null) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble) {
        throw new NotFoundError('Bubble');
      }

      // Check if user can view this bubble
      if (!BubbleService.canUserViewBubble(bubble, userId)) {
        throw new ForbiddenError('You do not have permission to view this bubble');
      }

      // Add additional data if user is authenticated
      if (userId) {
        bubble.isMember = await Bubble.isMember(bubbleId, userId);
        bubble.isModerator = await Bubble.isModerator(bubbleId, userId);
        bubble.userJoinedAt = await BubbleService.getUserJoinTime(bubbleId, userId);
      }

      return bubble;
    } catch (error) {
      throw error;
    }
  }

  // Search bubbles
  static async searchBubbles(userId, searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0, universityId, isPublic = null } = options;

      let bubbles;
      if (searchTerm) {
        bubbles = await Bubble.search(searchTerm, {
          limit,
          offset,
          universityId,
          isPublic
        });
      } else {
        bubbles = await Bubble.search('', {
          limit,
          offset,
          universityId,
          isPublic
        });
      }

      // Add user-specific data if authenticated
      if (userId) {
        for (const bubble of bubbles) {
          bubble.isMember = await Bubble.isMember(bubble.id, userId);
          bubble.isModerator = await Bubble.isModerator(bubble.id, userId);
        }
      }

      return bubbles;
    } catch (error) {
      throw error;
    }
  }

  // Get user's joined bubbles
  static async getUserBubbles(userId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      const bubbles = await Bubble.getUserBubbles(userId, {
        limit,
        offset
      });

      return bubbles;
    } catch (error) {
      throw error;
    }
  }

  // Join a bubble
  static async joinBubble(bubbleId, userId) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble) {
        throw new NotFoundError('Bubble');
      }

      // Check if user is already a member
      if (await Bubble.isMember(bubbleId, userId)) {
        return {
          success: true,
          message: 'Already a member of this bubble',
          bubble: bubble.toJSON()
        };
      }

      // Check if bubble is private and user has permission
      if (!bubble.isPublic) {
        // For now, only creators or moderators can join private bubbles
        // In a real implementation, this would check invitations
        if (!await Bubble.isModerator(bubbleId, userId)) {
          throw new ForbiddenError('This is a private bubble. You need an invitation to join.');
        }
      }

      // Add user to bubble
      const success = await Bubble.addMember(bubbleId, userId);
      
      if (success) {
        // Emit real-time events
        await BubbleService.broadcastBubbleMemberJoined(bubbleId, userId);
        
        // Update user's joined bubbles cache
        await BubbleService.updateUserBubblesCache(userId);

        return {
          success: true,
          message: 'Successfully joined bubble',
          bubble: bubble.toJSON()
        };
      }

      throw new Error('Failed to join bubble');
    } catch (error) {
      throw error;
    }
  }

  // Leave a bubble
  static async leaveBubble(bubbleId, userId) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble) {
        throw new NotFoundError('Bubble');
      }

      // Check if user is a member
      if (!await Bubble.isMember(bubbleId, userId)) {
        return {
          success: true,
          message: 'Not a member of this bubble',
          bubble: bubble.toJSON()
        };
      }

      // Check if user is creator or moderator (can't leave their own bubble)
      if (bubble.creatorId === userId) {
        throw new ValidationError('Bubble creators cannot leave their own bubble');
      }

      // Remove user from bubble
      const success = await Bubble.removeMember(bubbleId, userId);
      
      if (success) {
        // Emit real-time events
        await BubbleService.broadcastBubbleMemberLeft(bubbleId, userId);
        
        // Update user's joined bubbles cache
        await BubbleService.updateUserBubblesCache(userId);

        return {
          success: true,
          message: 'Successfully left bubble',
          bubble: bubble.toJSON()
        };
      }

      throw new Error('Failed to leave bubble');
    } catch (error) {
      throw error;
    }
  }

  // Update bubble
  static async updateBubble(bubbleId, userId, updateData) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble) {
        throw new NotFoundError('Bubble');
      }

    // Check if user is moderator or creator
    const isModerator = await Bubble.isModerator(bubbleId, userId);
    if (!isModerator) {
      throw new ForbiddenError('Only moderators can update bubbles');
    }

      const updatedBubble = await Bubble.update(bubbleId, updateData);
      
      // Emit real-time events
      await BubbleService.broadcastBubbleUpdated(updatedBubble);

      return updatedBubble;
    } catch (error) {
      throw error;
    }
  }

  // Delete bubble
  static async deleteBubble(bubbleId, userId) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble) {
        throw new NotFoundError('Bubble');
      }

      // Check if user is creator
      if (bubble.creatorId !== userId) {
        throw new ForbiddenError('Only the bubble creator can delete bubbles');
      }

      const success = await Bubble.delete(bubbleId, userId);
      
      if (success) {
        // Emit real-time events
        await BubbleService.broadcastBubbleDeleted(bubbleId, userId);
        
        return {
          success: true,
          message: 'Bubble deleted successfully'
        };
      }

      throw new Error('Failed to delete bubble');
    } catch (error) {
      throw error;
    }
  }

  // Get bubble statistics
  static async getBubbleStats(bubbleId) {
    try {
      const stats = await Bubble.getStats(bubbleId);
      
      return {
        memberCount: stats.memberCount,
        dropletCount: stats.dropletCount,
        activeMembers: stats.activeMembers,
        recentDroplets: stats.recentDroplets,
        engagementRate: stats.activeMembers > 0 ? stats.recentDroplets / stats.activeMembers : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Get trending bubbles
  static async getTrendingBubbles(options = {}) {
    try {
      const { limit = 10, universityId, timeWindow = '7d' } = options;
      
      const bubbles = await Bubble.getTrending({
        limit,
        universityId,
        timeWindow
      });

      return bubbles;
    } catch (error) {
      throw error;
    }
  }

  // Get recommended bubbles for user
  static async getRecommendedBubbles(userId, options = {}) {
    try {
      const { limit = 10 } = options;
      
      // Get user's joined bubbles
      const userBubbles = await Bubble.getUserBubbles(userId);
      const joinedHashtags = userBubbles.map(b => b.hashtag);
      
      // Find bubbles with similar tags that user hasn't joined
      const db = getDatabase();
      
      // This is a simplified recommendation algorithm
      // In production, this would be more sophisticated
      const rows = await db.all(`
        SELECT b.*, COUNT(ub.userId) as common_members
        FROM bubbles b
        LEFT JOIN user_bubbles ub1 ON b.id = ub1.bubbleId AND ub1.userId = ?
        LEFT JOIN user_bubbles ub2 ON b.id = ub2.bubbleId AND ub2.userId != ?
        LEFT JOIN user_bubbles ub3 ON b.id = ub3.bubbleId
        WHERE b.isPublic = 1 
          AND ub1.bubbleId IS NULL
          AND (json_extract(b.tags, '$') LIKE json_extract(ub3.tags, '$') OR ub3.bubbleId IS NULL)
        GROUP BY b.id
        HAVING common_members < 3 -- Exclude overcrowded bubbles
        ORDER BY common_members DESC, b.memberCount DESC, b.dropletCount DESC
        LIMIT ?
      `, [userId, limit]);

      return rows.map(row => Bubble.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Permission helper methods
  static canUserViewBubble(bubble, userId) {
    if (!userId) {
      // Anonymous users can only view public bubbles
      return bubble.isPublic;
    }

    // Creator can always view their own bubbles
    if (bubble.creatorId === userId) {
      return true;
    }

    // Moderators can always view bubbles they moderate
    if (bubble.moderators.includes(userId)) {
      return true;
    }

    // Public bubbles can be viewed by any authenticated user
    if (bubble.isPublic) {
      return true;
    }

    // Private bubbles require membership
    return false;
  }

  // Real-time event broadcasters
  static async broadcastBubbleCreated(bubble) {
    try {
      const eventData = {
        type: 'bubble_created',
        bubble: bubble.toJSON(),
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users (for discovery)
      broadcastEvent(events.BUBBLE_CREATED, eventData);

      // Notify creator
      emitToUser(bubble.creatorId, events.BUBBLE_CREATED, eventData);

      console.log(`Broadcast bubble created: ${bubble.id}`);
    } catch (error) {
      console.error('Error broadcasting bubble created:', error);
    }
  }

  static async broadcastBubbleUpdated(bubble) {
    try {
      const eventData = {
        type: 'bubble_updated',
        bubble: bubble.toJSON(),
        timestamp: new Date().toISOString()
      };

      // Broadcast to bubble members
      emitToBubble(bubble.id, events.BUBBLE_UPDATED, eventData);

      // Notify moderators and creator
      const notifyUsers = [bubble.creatorId, ...bubble.moderators];
      for (const userId of notifyUsers) {
        emitToUser(userId, events.BUBBLE_UPDATED, eventData);
      }

      console.log(`Broadcast bubble updated: ${bubble.id}`);
    } catch (error) {
      console.error('Error broadcasting bubble updated:', error);
    }
  }

  static async broadcastBubbleDeleted(bubbleId, deleterId) {
    try {
      const eventData = {
        type: 'bubble_deleted',
        bubbleId,
        deleterId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users
      broadcastEvent(events.BUBBLE_DELETED, eventData);

      console.log(`Broadcast bubble deleted: ${bubbleId}`);
    } catch (error) {
      console.error('Error broadcasting bubble deleted:', error);
    }
  }

  static async broadcastBubbleMemberJoined(bubbleId, userId) {
    try {
      const eventData = {
        type: 'bubble_member_joined',
        bubbleId,
        userId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to bubble members
      emitToBubble(bubbleId, events.BUBBLE_JOINED, eventData);

      // Notify the user who joined
      emitToUser(userId, events.BUBBLE_JOINED, eventData);

      console.log(`Broadcast bubble member joined: ${bubbleId}, user: ${userId}`);
    } catch (error) {
      console.error('Error broadcasting bubble member joined:', error);
    }
  }

  static async broadcastBubbleMemberLeft(bubbleId, userId) {
    try {
      const eventData = {
        type: 'bubble_member_left',
        bubbleId,
        userId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to bubble members
      emitToBubble(bubbleId, events.BUBBLE_LEFT, eventData);

      // Notify the user who left
      emitToUser(userId, events.BUBBLE_LEFT, eventData);

      console.log(`Broadcast bubble member left: ${bubbleId}, user: ${userId}`);
    } catch (error) {
      console.error('Error broadcasting bubble member left:', error);
    }
  }

  // Cache management helpers
  static async updateUserBubblesCache(userId) {
    try {
      // This would typically use Redis in production
      // For now, we'll just trigger feed refresh
      emitToUser(userId, 'feed:refresh_requested', {
        reason: 'bubble_membership_changed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user bubbles cache:', error);
    }
  }

  // User bubble management helper
  static async getUserJoinTime(bubbleId, userId) {
    try {
      const db = getDatabase();
      
      const row = await db.get(
        'SELECT joinedAt FROM user_bubbles WHERE bubbleId = ? AND userId = ?',
        [bubbleId, userId]
      );

      return row ? row.joinedAt : null;
    } catch (error) {
      console.error('Error getting user join time:', error);
      return null;
    }
  }

  // Validation helpers
  static validateBubbleData(bubbleData) {
    const errors = [];

    // Name validation
    if (!bubbleData.name || bubbleData.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Bubble name must be at least 2 characters long'
      });
    }

    if (bubbleData.name && bubbleData.name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Bubble name cannot exceed 50 characters'
      });
    }

    // Hashtag validation
    if (!bubbleData.hashtag || !bubbleData.hashtag.startsWith('#')) {
      errors.push({
        field: 'hashtag',
        message: 'Hashtag must start with #'
      });
    }

    if (bubbleData.hashtag && bubbleData.hashtag.length > 50) {
      errors.push({
        field: 'hashtag',
        message: 'Hashtag cannot exceed 50 characters'
      });
    }

    // Description validation
    if (bubbleData.description && bubbleData.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters'
      });
    }

    // Tags validation
    if (bubbleData.tags && bubbleData.tags.length > 10) {
      errors.push({
        field: 'tags',
        message: 'Cannot have more than 10 tags'
      });
    }

    return errors;
  }

  // Analytics helper
  static async getBubbleAnalytics(bubbleId, timeRange = '7d') {
    try {
      const db = getDatabase();
      
      // Calculate time condition
      let timeCondition = '';
      if (timeRange === '24h') {
        timeCondition = "AND createdAt >= datetime('now', '-24 hours')";
      } else if (timeRange === '7d') {
        timeCondition = "AND createdAt >= datetime('now', '-7 days')";
      } else if (timeRange === '30d') {
        timeCondition = "AND createdAt >= datetime('now', '-30 days')";
      }

      const analytics = await db.get(`
        SELECT 
          COUNT(CASE WHEN ub.joinedAt >= datetime('now', '-7 days') THEN 1 END) as new_members,
          COUNT(CASE WHEN d.createdAt >= datetime('now', '-7 days') THEN 1 END) as new_droplets,
          COUNT(DISTINCT d.authorId) as active_contributors,
          AVG(CASE WHEN ub.joinedAt >= datetime('now', '-7 days') THEN 1 END) as retention_rate
        FROM bubbles b
        LEFT JOIN user_bubbles ub ON b.id = ub.bubbleId
        LEFT JOIN droplets d ON b.id = d.bubbles AND d.deletedAt IS NULL
        WHERE b.id = ? ${timeCondition}
      `, [bubbleId]);

      return analytics;
    } catch (error) {
      console.error('Error getting bubble analytics:', error);
      return null;
    }
  }
}

module.exports = BubbleService;