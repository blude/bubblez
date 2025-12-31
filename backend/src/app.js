const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const config = require('./config');
const { errorHandler, notFoundHandler, logger } = require('./middleware/errors');
const { validateConfig } = require('./config');

// Validate configuration
validateConfig();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = socketIo(server, {
  cors: {
    origin: config.socketIO.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available throughout the app
app.set('io', io);

// Security middleware
app.use(helmet(config.security.helmet));

// CORS configuration
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: require('../package.json').version
  });
});

// API routes
const apiRouter = express.Router();

// Import route handlers (will be created later)
const userRoutes = require('./controllers/users');
const dropletRoutes = require('./controllers/droplets');
const bubbleRoutes = require('./controllers/bubbles');
const hotseatRoutes = require('./controllers/hotseat');
const universityRoutes = require('./controllers/university');

// Mount API routes
apiRouter.use('/users', userRoutes);
apiRouter.use('/droplets', dropletRoutes);
apiRouter.use('/bubbles', bubbleRoutes);
apiRouter.use('/hotseat', hotseatRoutes);
apiRouter.use('/university', universityRoutes);

// API documentation endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'University Social Network API',
    version: config.api.version,
    endpoints: {
      users: '/api/v1/users',
      droplets: '/api/v1/droplets',
      bubbles: '/api/v1/bubbles',
      hotseat: '/api/v1/hotseat',
      university: '/api/v1/university'
    },
    documentation: '/api/v1/docs',
    health: '/health'
  });
});

// Mount API with version prefix
app.use(config.api.prefix, apiRouter);

// Static file serving for uploads
app.use('/uploads', express.static(config.media.uploadDir));

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling
const { handleSocketConnection, setIo } = require('./services/realtime');

// Set io reference for real-time service
setIo(io);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  handleSocketConnection(socket, io);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`🚀 University Social Network API Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🏫 University: ${config.university.name} (${config.university.id})`);
  logger.info(`🔗 API Documentation: http://localhost:${PORT}${config.api.prefix}`);
});

module.exports = { app, server, io };