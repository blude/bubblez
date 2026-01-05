const config = require('../../config');
const { logger } = require('../../middleware/errors');
const FeedService = require('./feed');

// Real-time service for managing socket connections and events
const handleSocketConnection = (socket, io) => {
  const userId = socket.handshake.auth?.userId;
  
  if (userId) {
    // Join user to their personal room
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} connected via socket: ${socket.id}`);
  }

  // Handle authentication
  socket.on('authenticate', (token) => {
    // Validate token and join user rooms
    // Will be implemented in authentication flow
  });

  // Handle joining bubble rooms
  socket.on('join:bubble', (bubbleId) => {
    socket.join(`bubble:${bubbleId}`);
    logger.info(`Socket ${socket.id} joined bubble ${bubbleId}`);
  });

  // Handle leaving bubble rooms
  socket.on('leave:bubble', (bubbleId) => {
    socket.leave(`bubble:${bubbleId}`);
    logger.info(`Socket ${socket.id} left bubble ${bubbleId}`);
  });

  // Handle joining hotseat games
  socket.on('join:hotseat', (gameId) => {
    socket.join(`hotseat:${gameId}`);
    logger.info(`Socket ${socket.id} joined hotseat game ${gameId}`);
  });

  // Handle feed updates
  socket.on('feed:refresh', async (options) => {
    try {
      await FeedService.refreshUserFeed(userId, options);
    } catch (error) {
      logger.error(`Error refreshing feed for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to refresh feed' });
    }
  });

  // Handle feed subscription
  socket.on('feed:subscribe', async () => {
    try {
      await FeedService.subscribeToFeed(userId, socket);
    } catch (error) {
      logger.error(`Error subscribing user ${userId} to feed:`, error);
      socket.emit('error', { message: 'Failed to subscribe to feed' });
    }
  });

  // Handle feed unsubscription
  socket.on('feed:unsubscribe', async () => {
    try {
      await FeedService.unsubscribeFromFeed(userId, socket);
    } catch (error) {
      logger.error(`Error unsubscribing user ${userId} from feed:`, error);
    }
  });

  // Handle typing indicators
  socket.on('typing:start', async (data) => {
    try {
      await FeedService.sendTypingIndicator(userId, data.bubbleId, true, socket);
    } catch (error) {
      logger.error(`Error handling typing start:`, error);
    }
  });

  socket.on('typing:stop', async (data) => {
    try {
      await FeedService.sendTypingIndicator(userId, data.bubbleId, false, socket);
    } catch (error) {
      logger.error(`Error handling typing stop:`, error);
    }
  });

  // Handle search queries
  socket.on('search:query', async (data) => {
    try {
      await FeedService.handleSearchQuery(data.query, userId);
    } catch (error) {
      logger.error(`Error handling search query:`, error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    // Notify relevant rooms that user is offline
    if (userId) {
      socket.broadcast.emit('user:offline', { userId });
    }
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
};

// Helper functions for real-time events
let io = null;

const setIo = (socketIo) => {
  io = socketIo;
  
  // Initialize feed service when IO is set
  FeedService.initialize(io);
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToBubble = (bubbleId, event, data) => {
  if (io) {
    io.to(`bubble:${bubbleId}`).emit(event, data);
  }
};

const emitToHotseat = (gameId, event, data) => {
  if (io) {
    io.to(`hotseat:${gameId}`).emit(event, data);
  }
};

const broadcastEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Event types that will be implemented in user stories
const events = {
  // User Story 1 events
  DROPLET_CREATED: 'droplet:created',
  DROPLET_UPDATED: 'droplet:updated',
  DROPLET_DELETED: 'droplet:deleted',
  
  // User Story 2 events
  BUBBLE_JOINED: 'bubble:joined',
  BUBBLE_LEFT: 'bubble:left',
  BROBLE_CREATED: 'bubble:created',
  
  // User Story 3 events
  HOTSEAT_GAME_CREATED: 'hotseat:created',
  HOTSEAT_GAME_JOINED: 'hotseat:joined',
  HOTSEAT_GAME_UPDATED: 'hotseat:updated',
  
  // User Story 4 events
  INTERACTION_CREATED: 'interaction:created',
  INTERACTION_UPDATED: 'interaction:updated',
  
  // Real-time feed events
  FEED_INITIALIZED: 'feed:initialized',
  FEED_REFRESHED: 'feed:refreshed',
  TRENDING_UPDATED: 'trending:updated',
  USER_MENTIONED: 'user:mentioned',
  SEARCH_SUGGESTIONS: 'search:suggestions',
  FEED_STATS: 'feed:stats',
  
  // General events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  NOTIFICATION: 'notification',
  ERROR: 'error'
};

module.exports = {
  handleSocketConnection,
  emitToUser,
  emitToBubble,
  emitToHotseat,
  broadcastEvent,
  events,
  setIo
};