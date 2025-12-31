const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Placeholder routes - will be implemented in User Story 3

// GET /api/v1/hotseat/games - Get hotseat games
router.get('/games', authenticateToken, asyncHandler(async (req, res) => {
  // Will be implemented in User Story 3
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

// POST /api/v1/hotseat/games - Create new hotseat game
router.post('/games', authenticateToken, validate('hotseatGame'), asyncHandler(async (req, res) => {
  // Will be implemented in User Story 3
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

// POST /api/v1/hotseat/games/:gameId/join - Join hotseat game
router.post('/games/:gameId/join', authenticateToken, validate('id', 'params'), asyncHandler(async (req, res) => {
  // Will be implemented in User Story 3
  res.status(501).json({ error: 'Not implemented yet', code: 'NOT_IMPLEMENTED' });
}));

module.exports = router;