require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || './data/university_social.db',
    url: process.env.DATABASE_URL || 'sqlite:./data/university_social.db'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // University Configuration
  university: {
    id: process.env.UNIVERSITY_ID || 'university-demo',
    name: process.env.UNIVERSITY_NAME || 'Demo University',
    domain: process.env.UNIVERSITY_DOMAIN || 'university.edu'
  },
  
  // Real-time Configuration
  socketIO: {
    corsOrigin: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000'
  },
  
  // Media Upload Configuration
  media: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'application/pdf'
    ]
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },
  
  // Development Settings
  development: {
    cors: process.env.ENABLE_CORS === 'true',
    debugLogging: process.env.ENABLE_DEBUG_LOGGING === 'true'
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [`https://${process.env.UNIVERSITY_DOMAIN}`] 
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Security Headers
  security: {
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production'
    }
  },
  
  // API Configuration
  api: {
    version: 'v1',
    prefix: '/api/v1',
    pagination: {
      defaultLimit: 20,
      maxLimit: 100
    }
  }
};

// Validation helper
const validateConfig = () => {
  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (config.nodeEnv === 'development' && config.jwt.secret === 'fallback-secret-key-change-in-production') {
    console.warn('⚠️  Using fallback JWT secret. Please set JWT_SECRET in production!');
  }
};

// Export configuration
module.exports = {
  ...config,
  validateConfig
};