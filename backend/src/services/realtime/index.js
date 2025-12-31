const config = require('../../config');
const { logger } = require('../../middleware/errors');

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
  socket.on('feed:refresh', () => {
    // Will emit updated feed to user
    // Will be implemented in User Story 1
  });

  // Handle typing indicators
  socket.on('typing:start', (data) => {
    socket.to(`bubble:${data.bubbleId}`).emit('typing:indicator', {
      userId,
      isTyping: true
    });
  });

  socket.on('typing:stop', (data) => {
    socket.to(`bubble:${data.bubbleId}`).emit('typing:indicator', {
      userId,
      isTyping: false
    });
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