const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { NotFoundError, ValidationError } = require('../middleware/errors');

class Interaction {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.dropletId = data.dropletId;
    this.type = data.type;
    this.badgeType = data.badgeType || null;
    this.reason = data.reason || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Create new interaction
  static async create(interactionData) {
    try {
      // Validate required fields
      if (!interactionData.userId || !interactionData.dropletId || !interactionData.type) {
        throw new ValidationError('Missing required interaction fields');
      }

      // Check if user already interacted (for non-badge interactions)
      const existingInteraction = await Interaction.findUserInteraction(
        interactionData.userId, 
        interactionData.dropletId, 
        interactionData.type
      );

      if (existingInteraction && interactionData.type !== 'badge') {
        // Update existing interaction instead of creating new one
        return await Interaction.update(existingInteraction.id, interactionData);
      }

      // For badge interactions, allow multiple badges from same user
      const interaction = new Interaction(interactionData);

      const result = await db.run(
        `INSERT INTO interactions (
          id, userId, dropletId, type, badgeType, reason, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          interaction.id,
          interaction.userId,
          interaction.dropletId,
          interaction.type,
          interaction.badgeType,
          interaction.reason,
          interaction.createdAt
        ]
      );

      // Update droplet interaction metrics
      await Interaction.updateDropletMetrics(interactionData.dropletId, interaction.type, 1);

      return await Interaction.findById(interaction.id);
    } catch (error) {
      throw error;
    }
  }

  // Find interaction by ID
  static async findById(id) {
    try {
      const row = await db.get(
        `SELECT id, userId, dropletId, type, badgeType, reason, createdAt
         FROM interactions WHERE id = ?`,
        [id]
      );

      if (!row) {
        throw new NotFoundError('Interaction');
      }

      return new Interaction(row);
    } catch (error) {
      throw error;
    }
  }

  // Find user's interaction with a droplet
  static async findUserInteraction(userId, dropletId, type) {
    try {
      const row = await db.get(
        `SELECT id, userId, dropletId, type, badgeType, reason, createdAt
         FROM interactions 
         WHERE userId = ? AND dropletId = ? AND type = ?
         ORDER BY createdAt DESC
         LIMIT 1`,
        [userId, dropletId, type]
      );

      return row ? new Interaction(row) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find all interactions for a droplet
  static async findByDroplet(dropletId, options = {}) {
    try {
      const { type, limit = 50, offset = 0 } = options;

      let query = `
        SELECT id, userId, dropletId, type, badgeType, reason, createdAt
        FROM interactions WHERE dropletId = ?
      `;
      const params = [dropletId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.all(query, params);
      return rows.map(row => new Interaction(row));
    } catch (error) {
      throw error;
    }
  }

  // Update interaction
  static async update(id, updates) {
    try {
      const allowedUpdates = ['badgeType', 'reason'];
      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      updateValues.push(id);

      const result = await db.run(
        `UPDATE interactions SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.changes === 0) {
        throw new NotFoundError('Interaction');
      }

      return await Interaction.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete interaction
  static async delete(id, userId = null) {
    try {
      // Check permission if userId provided
      if (userId) {
        const interaction = await Interaction.findById(id);
        if (interaction.userId !== userId) {
          throw new ValidationError('You can only delete your own interactions');
        }
      }

      const result = await db.run('DELETE FROM interactions WHERE id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('Interaction');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Update droplet interaction metrics
  static async updateDropletMetrics(dropletId, interactionType, change = 1) {
    try {
      let metricField = '';
      
      switch (interactionType) {
        case 'upvote':
          metricField = 'upvotes';
          break;
        case 'downvote':
          metricField = 'downvotes';
          break;
        case 'comment':
          metricField = 'comments';
          break;
        case 'share':
          metricField = 'shares';
          break;
        case 'bookmark':
          metricField = 'bookmarks';
          break;
        default:
          return; // No metric to update for badge interactions
      }

      // Get current interactions
      const dropletRow = await db.get(
        'SELECT interactions FROM droplets WHERE id = ?',
        [dropletId]
      );

      if (!dropletRow) {
        throw new NotFoundError('Droplet');
      }

      let interactions = dropletRow.interactions ? JSON.parse(dropletRow.interactions) : {
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        badges: []
      };

      // Update the specific metric
      interactions[metricField] = Math.max(0, (interactions[metricField] || 0) + change);

      // Save back to droplet
      await db.run(
        'UPDATE droplets SET interactions = ?, updatedAt = ? WHERE id = ?',
        [JSON.stringify(interactions), new Date().toISOString(), dropletId]
      );

      return interactions;
    } catch (error) {
      throw error;
    }
  }

  // Get interaction summary for droplet
  static async getDropletSummary(dropletId) {
    try {
      const dropletRow = await db.get(
        'SELECT interactions FROM droplets WHERE id = ?',
        [dropletId]
      );

      if (!dropletRow) {
        throw new NotFoundError('Droplet');
      }

      const interactions = dropletRow.interactions ? JSON.parse(dropletRow.interactions) : {
        upvotes: 0,
        downvotes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        badges: []
      };

      // Get recent interactions with details
      const recentInteractions = await db.all(
        `SELECT i.*, u.username, u.displayName
         FROM interactions i
         JOIN users u ON i.userId = u.id
         WHERE i.dropletId = ?
         ORDER BY i.createdAt DESC
         LIMIT 20`,
        [dropletId]
      );

      return {
        metrics: interactions,
        recent: recentInteractions.map(row => ({
          id: row.id,
          userId: row.userId,
          username: row.username,
          displayName: row.displayName,
          type: row.type,
          badgeType: row.badgeType,
          reason: row.reason,
          createdAt: row.createdAt
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user's interaction history
  static async getUserHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, type } = options;

      let query = `
        SELECT i.*, d.content as dropletContent, d.authorId as dropletAuthorId,
               u.username as dropletAuthorUsername, u.displayName as dropletAuthorName
        FROM interactions i
        JOIN droplets d ON i.dropletId = d.id
        JOIN users u ON d.authorId = u.id
        WHERE i.userId = ?
      `;
      const params = [userId];

      if (type) {
        query += ' AND i.type = ?';
        params.push(type);
      }

      query += ' ORDER BY i.createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.all(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get interaction statistics
  static async getStats(options = {}) {
    try {
      const { startDate, endDate, userId, dropletId } = options;

      let whereClauses = [];
      let params = [];

      if (startDate) {
        whereClauses.push('createdAt >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereClauses.push('createdAt <= ?');
        params.push(endDate);
      }

      if (userId) {
        whereClauses.push('userId = ?');
        params.push(userId);
      }

      if (dropletId) {
        whereClauses.push('dropletId = ?');
        params.push(dropletId);
      }

      const whereClause = whereClauses.length > 0 ? 
        `WHERE ${whereClauses.join(' AND ')}` : '';

      const query = `
        SELECT 
          type,
          COUNT(*) as count,
          DATE(createdAt) as date,
          strftime('%Y-%m', createdAt) as month,
          strftime('%Y', createdAt) as year
        FROM interactions 
        ${whereClause}
        GROUP BY type, DATE(createdAt)
        ORDER BY date DESC
      `;

      const rows = await db.all(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON response format
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      dropletId: this.dropletId,
      type: this.type,
      badgeType: this.badgeType,
      reason: this.reason,
      createdAt: this.createdAt
    };
  }
}

module.exports = Interaction;