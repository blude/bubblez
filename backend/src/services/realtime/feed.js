const { emitToUser, emitToBubble, broadcastEvent, events, setIo } = require('../index');
const DropletService = require('../droplet');
const { logger } = require('../../middleware/errors');

class FeedService {
  static async initialize() {
    // Set up feed service when real-time is ready
    logger.info('Feed service initialized for real-time updates');
  }

  // Broadcast new droplet to relevant recipients
  static async broadcastDropletCreated(droplet) {
    try {
      const eventData = {
        type: 'droplet_created',
        droplet: droplet.toJSON(true),
        timestamp: new Date().toISOString(),
        author: droplet.author
      };

      // Send to user's followers (not implemented yet)
      await emitToUser(droplet.authorId, events.DROPLET_CREATED, eventData);

      // Send to all bubbles the droplet belongs to
      if (droplet.bubbles && droplet.bubbles.length > 0) {
        for (const bubbleId of droplet.bubbles) {
          await emitToBubble(bubbleId, events.DROPLET_CREATED, {
            ...eventData,
            bubbleId
          });
        }
      }

      // Send to public feed
      if (['public', 'university'].includes(droplet.visibility)) {
        await broadcastEvent(events.DROPLET_CREATED, eventData);
      }

      logger.info(`Broadcast droplet created: ${droplet.id}`);
    } catch (error) {
      logger.error('Error broadcasting droplet created:', error);
    }
  }

  // Broadcast droplet update
  static async broadcastDropletUpdated(droplet) {
    try {
      const eventData = {
        type: 'droplet_updated',
        droplet: droplet.toJSON(true),
        timestamp: new Date().toISOString(),
        author: droplet.author
      };

      // Send to droplet's bubbles
      if (droplet.bubbles && droplet.bubbles.length > 0) {
        for (const bubbleId of droplet.bubbles) {
          await emitToBubble(bubbleId, events.DROPLET_UPDATED, {
            ...eventData,
            bubbleId
          });
        }
      }

      // Send to author
      await emitToUser(droplet.authorId, events.DROPLET_UPDATED, eventData);

      logger.info(`Broadcast droplet updated: ${droplet.id}`);
    } catch (error) {
      logger.error('Error broadcasting droplet updated:', error);
    }
  }

  // Broadcast droplet deletion
  static async broadcastDropletDeleted(dropletId, authorId) {
    try {
      const eventData = {
        type: 'droplet_deleted',
        dropletId,
        authorId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to all users (deleted droplets should disappear from all feeds)
      await broadcastEvent(events.DROPLET_DELETED, eventData);

      // Notify author
      await emitToUser(authorId, events.DROPLET_DELETED, eventData);

      logger.info(`Broadcast droplet deleted: ${dropletId}`);
    } catch (error) {
      logger.error('Error broadcasting droplet deleted:', error);
    }
  }

  // Handle user joining feed (subscribe to personalized updates)
  static async subscribeToFeed(userId, socket) {
    try {
      // Join user's personal room
      socket.join(`feed:${userId}`);
      
      // Join user's bubble rooms
      // This will be enhanced when bubble membership is implemented
      const User = require('../../models/user');
      const user = await User.findById(userId);
      
      if (user && user.joinedBubbles) {
        for (const bubbleId of user.joinedBubbles) {
          socket.join(`bubble:${bubbleId}`);
        }
      }

      // Send initial feed data
      const initialFeed = await DropletService.getUserFeed(userId, { limit: 20 });
      
      await emitToUser(userId, events.FEED_INITIALIZED, {
        type: 'feed_initialized',
        feed: initialFeed,
        timestamp: new Date().toISOString()
      });

      logger.info(`User ${userId} subscribed to feed`);
    } catch (error) {
      logger.error('Error subscribing user to feed:', error);
    }
  }

  // Handle user leaving feed
  static async unsubscribeFromFeed(userId, socket) {
    try {
      socket.leave(`feed:${userId}`);
      
      // Leave bubble rooms
      const User = require('../../models/user');
      const user = await User.findById(userId);
      
      if (user && user.joinedBubbles) {
        for (const bubbleId of user.joinedBubbles) {
          socket.leave(`bubble:${bubbleId}`);
        }
      }

      logger.info(`User ${userId} unsubscribed from feed`);
    } catch (error) {
      logger.error('Error unsubscribing user from feed:', error);
    }
  }

  // Send feed refresh to user
  static async refreshUserFeed(userId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      const freshFeed = await DropletService.getUserFeed(userId, { limit, offset });

      await emitToUser(userId, events.FEED_REFRESHED, {
        type: 'feed_refreshed',
        feed: freshFeed,
        pagination: {
          limit,
          offset,
          hasMore: freshFeed.length === limit
        },
        timestamp: new Date().toISOString()
      });

      logger.info(`Refreshed feed for user ${userId}`);
    } catch (error) {
      logger.error('Error refreshing user feed:', error);
    }
  }

  // Handle trending content updates
  static async broadcastTrendingUpdates() {
    try {
      // Get current trending droplets
      const trendingDroplets = await DropletService.getTrendingDroplets({
        limit: 10,
        timeWindow: '1h' // Last hour of trending
      });

      const eventData = {
        type: 'trending_updated',
        trending: trendingDroplets.map(droplet => droplet.toJSON(true)),
        timeWindow: '1h',
        timestamp: new Date().toISOString()
      };

      await broadcastEvent(events.TRENDING_UPDATED, eventData);

      logger.info('Broadcast trending updates');
    } catch (error) {
      logger.error('Error broadcasting trending updates:', error);
    }
  }

  // Send typing indicator to bubbles
  static async sendTypingIndicator(userId, bubbleId, isTyping, socket) {
    try {
      const eventData = {
        type: 'typing_indicator',
        userId,
        bubbleId,
        isTyping,
        timestamp: new Date().toISOString()
      };

      if (isTyping) {
        socket.to(`bubble:${bubbleId}`).broadcast('typing:start', eventData);
      } else {
        socket.to(`bubble:${bubbleId}`).broadcast('typing:stop', eventData);
      }

      logger.info(`Typing indicator for user ${userId} in bubble ${bubbleId}: ${isTyping}`);
    } catch (error) {
      logger.error('Error sending typing indicator:', error);
    }
  }

  // Handle notification for mentions
  static async notifyMentionedUsers(droplet, mentionedUsers) {
    try {
      const eventData = {
        type: 'user_mentioned',
        droplet: droplet.toJSON(true),
        mentionedUsers,
        timestamp: new Date().toISOString()
      };

      // Notify each mentioned user
      for (const mentionedUserId of mentionedUsers) {
        await emitToUser(mentionedUserId, events.USER_MENTIONED, {
          ...eventData,
          mentionedUserId
        });
      }

      logger.info(`Notified ${mentionedUsers.length} users of mentions in droplet ${droplet.id}`);
    } catch (error) {
      logger.error('Error notifying mentioned users:', error);
    }
  }

  // Handle real-time search suggestions
  static async handleSearchQuery(query, userId) {
    try {
      // Get search suggestions
      const searchResults = await DropletService.searchDroplets(userId, query, {
        limit: 5
      });

      const eventData = {
        type: 'search_suggestions',
        query,
        results: searchResults.map(droplet => droplet.toJSON(true)),
        timestamp: new Date().toISOString()
      };

      await emitToUser(userId, events.SEARCH_SUGGESTIONS, eventData);

      logger.info(`Search suggestions for user ${userId}, query: ${query}`);
    } catch (error) {
      logger.error('Error handling search query:', error);
    }
  }

  // Get feed statistics for user
  static async getFeedStats(userId) {
    try {
      const stats = await DropletService.getUserStats(userId);
      
      const eventData = {
        type: 'feed_stats',
        stats,
        timestamp: new Date().toISOString()
      };

      await emitToUser(userId, events.FEED_STATS, eventData);

      return stats;
    } catch (error) {
      logger.error('Error getting feed stats:', error);
      throw error;
    }
  }

  // Cleanup old feed data
  static async cleanupOldFeedData() {
    try {
      // This would typically be run periodically
      // Mark old droplets as archived or move to cold storage
      
      logger.info('Feed cleanup completed');
    } catch (error) {
      logger.error('Error during feed cleanup:', error);
    }
  }
}

// Additional events for the real-time service
const additionalEvents = {
  FEED_INITIALIZED: 'feed:initialized',
  FEED_REFRESHED: 'feed:refreshed',
  TRENDING_UPDATED: 'trending:updated',
  USER_MENTIONED: 'user:mentioned',
  SEARCH_SUGGESTIONS: 'search:suggestions',
  FEED_STATS: 'feed:stats',
  NOTIFICATION: 'notification'
};

// Merge additional events with existing ones
Object.assign(events, additionalEvents);

module.exports = FeedService;