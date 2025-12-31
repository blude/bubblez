const Joi = require('joi');
const { ValidationError } = require('./errors');

// Common validation schemas
const schemas = {
  // User validation
  user: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    displayName: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('student', 'professor', 'staff').required(),
    universityId: Joi.string().required(),
    department: Joi.string().max(100).optional(),
    yearOfStudy: Joi.number().integer().min(1).max(10).optional()
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Droplet validation
  droplet: Joi.object({
    content: Joi.string().min(1).max(5000).required(),
    bubbles: Joi.array().items(Joi.string()).max(5).optional(),
    replyToId: Joi.string().uuid().optional(),
    visibility: Joi.string().valid('public', 'university', 'bubble', 'private').default('university')
  }),

  // Bubble validation
  bubble: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    hashtag: Joi.string().pattern(/^#[a-zA-Z0-9_]+$/).max(50).required(),
    description: Joi.string().max(500).optional(),
    isPublic: Joi.boolean().default(true),
    tags: Joi.array().items(Joi.string()).max(10).optional()
  }),

  // Pagination validation
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0).default(0)
  }),

  // ID validation
  id: Joi.string().uuid().required(),

  // Hotseat game validation
  hotseatGame: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    maxParticipants: Joi.number().integer().min(3).max(50).required(),
    roundDuration: Joi.number().integer().min(5).max(60).required(),
    totalRounds: Joi.number().integer().min(1).max(10).required()
  }),

  // Interaction validation
  interaction: Joi.object({
    type: Joi.string().valid('upvote', 'downvote', 'bookmark', 'share', 'badge').required(),
    badgeType: Joi.string().valid('helpful', 'insightful', 'creative', 'collaborative').when('type', {
      is: 'badge',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    reason: Joi.string().max(200).when('type', {
      is: 'badge',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  // University system validation
  universitySystem: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    type: Joi.string().valid('e_learning', 'student_portal', 'intranet', 'public_portal', 'student_information_system').required(),
    apiUrl: Joi.string().uri().required(),
    authenticationMethod: Joi.string().valid('oauth2', 'ldap', 'api_key', 'saml').required(),
    syncFrequency: Joi.number().integer().min(1).max(1440).required() // minutes
  })
};

// Validation middleware factory
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Invalid validation schema' });
    }

    const data = source === 'body' ? req.body : 
                source === 'query' ? req.query : 
                source === 'params' ? req.params : req;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
        timestamp: new Date().toISOString()
      });
    }

    // Attach validated data to request
    if (source === 'body') {
      req.validatedBody = value;
    } else if (source === 'query') {
      req.validatedQuery = value;
    } else if (source === 'params') {
      req.validatedParams = value;
    } else {
      req.validatedData = value;
    }

    next();
  };
};

// Custom validation helpers
const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  
  const parsedLimit = parseInt(limit) || 20;
  const parsedOffset = parseInt(offset) || 0;

  if (parsedLimit < 1 || parsedLimit > 100) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 100',
      code: 'INVALID_PAGINATION'
    });
  }

  if (parsedOffset < 0) {
    return res.status(400).json({
      error: 'Offset must be non-negative',
      code: 'INVALID_PAGINATION'
    });
  }

  req.pagination = {
    limit: parsedLimit,
    offset: parsedOffset
  };

  next();
};

// File validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }

  const file = req.file;
  const config = require('../config');

  // Check file size
  if (file.size > config.media.maxFileSize) {
    return res.status(413).json({
      error: 'File too large',
      code: 'FILE_TOO_LARGE',
      maxSize: config.media.maxFileSize
    });
  }

  // Check file type
  if (!config.media.allowedFileTypes.includes(file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid file type',
      code: 'INVALID_FILE_TYPE',
      allowedTypes: config.media.allowedFileTypes
    });
  }

  next();
};

module.exports = {
  schemas,
  validate,
  validatePagination,
  validateFileUpload
};