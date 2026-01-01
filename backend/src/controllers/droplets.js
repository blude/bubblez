const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { validate, validatePagination } = require('../middleware/validation');
const DropletService = require('../services/droplet');
const { uploadMultiple, validateMediaFile, handleUploadError } = require('../services/media/upload_backup');

const router = express.Router();

// GET /api/v1/droplets - Get user's feed
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { bubbles, search } = req.query;

  let droplets;
  if (search) {
    droplets = await DropletService.searchDroplets(req.user.id, search, {
      limit,
      offset,
      bubbles: bubbles ? bubbles.split(',') : undefined
    });
  } else {
    droplets = await DropletService.getUserFeed(req.user.id, {
      limit,
      offset,
      bubbles: bubbles ? bubbles.split(',') : undefined
    });
  }

  res.json({
    droplets: droplets.map(droplet => droplet.toJSON(true)),
    hasMore: droplets.length === limit,
    pagination: {
      limit,
      offset,
      total: droplets.length
    }
  });
}));

// POST /api/v1/droplets - Create new droplet
router.post('/', 
  authenticateToken, 
  validate('droplet'), 
  uploadMultiple, 
  validateMediaFile, 
  handleUploadError,
  asyncHandler(async (req, res) => {
    const dropletData = req.validatedBody;
    const mediaFiles = req.files ? req.files.map(file => ({
      id: file.filename,
      type: require('../models/media').getMediaTypeFromMimeType(file.mimetype),
      url: `/uploads/${file.filename}`,
      thumbnailUrl: require('../services/media/upload').generateThumbnailUrl(file),
      size: file.size,
      mimeType: file.mimeType
    })) : [];

    // Validate content
    await DropletService.validateDropletContent(dropletData.content, req.user.id);

    const droplet = await DropletService.create(req.user.id, dropletData, mediaFiles);

    res.status(201).json({
      droplet: droplet.toJSON(true),
      message: 'Droplet created successfully'
    });
  })
);

// GET /api/v1/droplets/:dropletId - Get droplet by ID
router.get('/:dropletId', optionalAuth, validate('id', 'params'), asyncHandler(async (req, res) => {
  const dropletId = req.validatedParams.id;
  const userId = req.user ? req.user.id : null;

  const droplet = await DropletService.getDroplet(dropletId, userId);

  res.json({
    droplet: droplet.toJSON(true)
  });
}));

// PUT /api/v1/droplets/:dropletId - Update droplet
router.put('/:dropletId', authenticateToken, validate('id', 'params'), validate('droplet'), asyncHandler(async (req, res) => {
  const dropletId = req.validatedParams.id;
  const updates = req.validatedBody;

  const updatedDroplet = await DropletService.updateDroplet(dropletId, req.user.id, updates);

  res.json({
    droplet: updatedDroplet.toJSON(true),
    message: 'Droplet updated successfully'
  });
}));

// DELETE /api/v1/droplets/:dropletId - Delete droplet
router.delete('/:dropletId', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const dropletId = req.validatedParams.id;

  await DropletService.deleteDroplet(dropletId, req.user.id);

  res.json({
    message: 'Droplet deleted successfully'
  });
}));

// GET /api/v1/droplets/:dropletId/replies - Get droplet replies
router.get('/:dropletId/replies', optionalAuth, validate('id', 'params'), validatePagination, asyncHandler(async (req, res) => {
  const dropletId = req.validatedParams.id;
  const { limit, offset } = req.pagination;
  const userId = req.user ? req.user.id : null;

  // Check if user can view the parent droplet
  const parentDroplet = await DropletService.getDroplet(dropletId, userId);
  
  const replies = await DropletService.getDropletReplies(dropletId, {
    limit,
    offset,
    userId
  });

  res.json({
    replies: replies.map(reply => reply.toJSON(true)),
    hasMore: replies.length === limit,
    pagination: {
      limit,
      offset,
      total: replies.length
    }
  });
}));

// POST /api/v1/droplets/:dropletId/interact - Interact with droplet
router.post('/:dropletId/interact', authenticateToken, validate('id', 'params'), validate('interaction'), asyncHandler(async (req, res) => {
  const dropletId = req.validatedParams.id;
  const interactionData = req.validatedBody;

  // This will be implemented in User Story 4
  res.status(501).json({ 
    error: 'Interactions will be implemented in User Story 4', 
    code: 'NOT_IMPLEMENTED' 
  });
}));

// GET /api/v1/droplets/trending - Get trending droplets
router.get('/trending', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { timeWindow } = req.query;

  const trendingDroplets = await DropletService.getTrendingDroplets({
    limit,
    offset,
    timeWindow: timeWindow || '24h'
  });

  res.json({
    droplets: trendingDroplets.map(droplet => droplet.toJSON(true)),
    hasMore: trendingDroplets.length === limit,
    timeWindow: timeWindow || '24h'
  });
}));

// GET /api/v1/droplets/search - Search droplets
router.get('/search', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { q: searchTerm, bubbles } = req.query;

  if (!searchTerm) {
    return res.status(400).json({
      error: 'Search term is required',
      code: 'SEARCH_TERM_REQUIRED'
    });
  }

  const searchResults = await DropletService.searchDroplets(req.user.id, searchTerm, {
    limit,
    offset,
    bubbles: bubbles ? bubbles.split(',') : undefined
  });

  res.json({
    droplets: searchResults.map(droplet => droplet.toJSON(true)),
    hasMore: searchResults.length === limit,
    searchTerm,
    pagination: {
      limit,
      offset,
      total: searchResults.length
    }
  });
}));

// GET /api/v1/droplets/user/:userId - Get user's droplets
router.get('/user/:userId', optionalAuth, validate('id', 'params'), validatePagination, asyncHandler(async (req, res) => {
  const targetUserId = req.validatedParams.id;
  const { limit, offset } = req.pagination;
  const currentUserId = req.user ? req.user.id : null;

  const userDroplets = await DropletService.getUserDroplets(targetUserId, {
    limit,
    offset,
    requestingUserId: currentUserId
  });

  res.json({
    droplets: userDroplets.map(droplet => droplet.toJSON(true)),
    hasMore: userDroplets.length === limit,
    userId: targetUserId,
    pagination: {
      limit,
      offset,
      total: userDroplets.length
    }
  });
}));

module.exports = router;