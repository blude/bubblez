const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { validate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Placeholder routes - will be implemented in User Story 2

// GET /api/v1/bubbles - Get bubbles
router.get('/', validatePagination, asyncHandler(async (req, res) => {
  // Will be implemented in User Story 2
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

// POST /api/v1/bubbles - Create new bubble
router.post('/', authenticateToken, validate('bubble'), asyncHandler(async (req, res) => {
  // Will be implemented in User Story 2
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

// POST /api/v1/bubbles/:bubbleId/join - Join bubble
router.post('/:bubbleId/join', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  // Will be implemented in User Story 2
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

// POST /api/v1/bubbles/:bubbleId/leave - Leave bubble
router.post('/:bubbleId/leave', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  // Will be implemented in User Story 2
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

module.exports = router;