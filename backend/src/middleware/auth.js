const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Generate JWT token for user
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    universityId: user.universityId
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'university-social-network',
    audience: 'university-users'
  });
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Validate user from database
const validateUser = async (userId) => {
  try {
    const user = await db.get(
      'SELECT id, username, email, role, universityId, isActive FROM users WHERE id = ? AND isActive = 1',
      [userId]
    );
    return user;
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
};

// Middleware to refresh token
const refreshToken = async (req, res, next) => {
  try {
    const user = await validateUser(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_INVALID'
      });
    }

    const newToken = generateToken(user);
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Middleware to check if user can access specific resource
const checkResourceAccess = async (req, res, next, resourceType, resourceId) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Professors and staff have broader access
    if (userRole === 'professor' || userRole === 'staff') {
      return next();
    }

    // Students can only access their own resources
    let query = '';
    switch (resourceType) {
      case 'droplet':
        query = 'SELECT authorId FROM droplets WHERE id = ?';
        break;
      case 'bubble':
        query = 'SELECT creatorId FROM bubbles WHERE id = ?';
        break;
      default:
        return res.status(400).json({ error: 'Invalid resource type' });
    }

    const resource = await db.get(query, [resourceId]);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.authorId === userId || resource.creatorId === userId) {
      return next();
    }

    res.status(403).json({ error: 'Access denied to resource' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
  hashPassword,
  verifyPassword,
  validateUser,
  refreshToken,
  optionalAuth,
  checkResourceAccess
};