const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { validate, validatePagination } = require('../middleware/validation');
const BubbleService = require('../services/bubble');

const router = express.Router();

// GET /api/v1/bubbles - Get bubbles with optional search and filters
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { search, university, isPublic } = req.query;

  try {
    const bubbles = await BubbleService.searchBubbles(req.user.id, search, {
      limit,
      offset,
      universityId: university,
      isPublic: isPublic !== undefined ? isPublic === 'true' : null
    });

    res.json({
      bubbles: bubbles.map(bubble => bubble.toJSON()),
      hasMore: bubbles.length === limit,
      pagination: {
        limit,
        offset,
        total: bubbles.length
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Failed to search bubbles',
      code: 'SEARCH_ERROR'
    });
  }
}));

// POST /api/v1/bubbles - Create new bubble
router.post('/', authenticateToken, validate('bubble'), asyncHandler(async (req, res) => {
  const bubbleData = req.validatedBody;

  try {
    const bubble = await BubbleService.create(req.user.id, bubbleData);

    res.status(201).json({
      bubble: bubble.toJSON(),
      message: 'Bubble created successfully'
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Failed to create bubble',
      code: 'BUBBLE_CREATE_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/:bubbleId - Get bubble by ID
router.get('/:bubbleId', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;

  try {
    const bubble = await BubbleService.getBubble(bubbleId, req.user.id);

    res.json({
      bubble: bubble.toJSON()
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to get bubble',
      code: 'BUBBLE_GET_ERROR'
    });
  }
}));

// POST /api/v1/bubbles/:bubbleId/join - Join a bubble
router.post('/:bubbleId/join', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;

  try {
    const result = await BubbleService.joinBubble(bubbleId, req.user.id);

    if (result.success) {
      res.json({
        message: result.message,
        bubble: result.bubble.toJSON()
      });
    } else {
      res.status(400).json({
        error: result.message,
        code: 'BUBBLE_JOIN_ERROR'
      });
    }
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to join bubble',
      code: 'BUBBLE_JOIN_ERROR'
    });
  }
}));

// POST /api/v1/bubbles/:bubbleId/leave - Leave a bubble
router.post('/:bubbleId/leave', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;

  try {
    const result = await BubbleService.leaveBubble(bubbleId, req.user.id);

    if (result.success) {
      res.json({
        message: result.message,
        bubble: result.bubble.toJSON()
      });
    } else {
      res.status(400).json({
        error: result.message,
        code: 'BUBBLE_LEAVE_ERROR'
      });
    }
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to leave bubble',
      code: 'BUBBLE_LEAVE_ERROR'
    });
  }
}));

// PUT /api/v1/bubbles/:bubbleId - Update bubble
router.put('/:bubbleId', authenticateToken, validate('id', 'params'), validate('bubble'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;
  const updateData = req.validatedBody;

  try {
    const updatedBubble = await BubbleService.updateBubble(bubbleId, req.user.id, updateData);

    res.json({
      bubble: updatedBubble.toJSON(),
      message: 'Bubble updated successfully'
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to update bubble',
      code: 'BUBBLE_UPDATE_ERROR'
    });
  }
}));

// DELETE /api/v1/bubbles/:bubbleId - Delete bubble
router.delete('/:bubbleId', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;

  try {
    const result = await BubbleService.deleteBubble(bubbleId, req.user.id);

    res.json({
      message: result.message
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to delete bubble',
      code: 'BUBBLE_DELETE_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/trending - Get trending bubbles
router.get('/trending', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { timeWindow = '7d', university } = req.query;

  try {
    const bubbles = await BubbleService.getTrendingBubbles(req.user.id, {
      limit,
      offset,
      timeWindow,
      universityId: university
    });

    res.json({
      bubbles: bubbles.map(bubble => bubble.toJSON()),
      hasMore: bubbles.length === limit,
      timeWindow,
      pagination: {
        limit,
        offset,
        total: bubbles.length
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Failed to get trending bubbles',
      code: 'TRENDING_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/recommended - Get recommended bubbles for user
router.get('/recommended', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const { limit, offset } = req.pagination;
  const { university } = req.query;

  try {
    const bubbles = await BubbleService.getRecommendedBubbles(req.user.id, {
      limit,
      offset,
      universityId: university
    });

    res.json({
      bubbles: bubbles.map(bubble => bubble.toJSON()),
      hasMore: bubbles.length === limit,
      pagination: {
        limit,
        offset,
        total: bubbles.length
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Failed to get recommended bubbles',
      code: 'RECOMMENDATIONS_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/user/:userId - Get user's bubbles
router.get('/user/:userId', authenticateToken, validate('id', 'params'), validatePagination, asyncHandler(async (req, res) => {
  const targetUserId = req.validatedParams.id;
  const { limit, offset } = req.pagination;

  try {
    // Only allow users to view their own bubbles or if they have special permissions
    if (targetUserId !== req.user.id) {
      // For now, only allow users to view their own bubbles
      // In a real implementation, this might allow professors to view student bubbles, etc.
      return res.status(403).json({
        error: 'You can only view your own bubbles',
        code: 'ACCESS_DENIED'
      });
    }

    const bubbles = await BubbleService.getUserBubbles(targetUserId, {
      limit,
      offset
    });

    res.json({
      bubbles: bubbles.map(bubble => bubble.toJSON()),
      hasMore: bubbles.length === limit,
      userId: targetUserId,
      pagination: {
        limit,
        offset,
        total: bubbles.length
      }
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Failed to get user bubbles',
      code: 'USER_BUBBLES_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/:bubbleId/stats - Get bubble statistics
router.get('/:bubbleId/stats', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;

  try {
    const bubble = await BubbleService.getBubble(bubbleId, req.user.id);
    const stats = await BubbleService.getBubbleStats(bubbleId);

    // Check if user can view stats (moderator or creator)
    if (!await BubbleService.isModerator(bubbleId, req.user.id)) {
      return res.status(403).json({
        error: 'Only moderators can view bubble statistics',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      bubbleId: bubble.id,
      stats,
      bubble: bubble.toJSON(false) // Exclude private data for stats
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to get bubble statistics',
      code: 'BUBBLE_STATS_ERROR'
    });
  }
}));

// GET /api/v1/bubbles/:bubbleId/analytics - Get bubble analytics
router.get('/:bubbleId/analytics', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  const bubbleId = req.validatedParams.id;
  const { timeRange = '7d' } = req.query;

  try {
    const bubble = await BubbleService.getBubble(bubbleId, req.user.id);
    const analytics = await BubbleService.getBubbleAnalytics(bubbleId, timeRange);

    // Check if user can view analytics (moderator or creator)
    if (!await BubbleService.isModerator(bubbleId, req.user.id)) {
      return res.status(403).json({
        error: 'Only moderators can view bubble analytics',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({
      bubbleId: bubble.id,
      analytics,
      timeRange,
      bubble: bubble.toJSON(false) // Exclude private data for analytics
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: error.message,
        code: 'BUBBLE_NOT_FOUND'
      });
    }

    if (error.code === 'FORBIDDEN') {
      return res.status(403).json({
        error: error.message,
        code: 'ACCESS_DENIED'
      });
    }

    res.status(400).json({
      error: error.message || 'Failed to get bubble analytics',
      code: 'BUBBLE_ANALYTICS_ERROR'
    });
  }
}));

module.exports = router;