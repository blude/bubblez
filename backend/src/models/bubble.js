const { getDatabase } = require('../database/connection');
const { NotFoundError, ValidationError } = require('../middleware/errors');
const { v4: uuidv4 } = require('uuid');

class Bubble {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.hashtag = data.hashtag;
    this.description = data.description || null;
    this.creatorId = data.creatorId;
    this.memberCount = data.memberCount || 1; // Creator counts as first member
    this.dropletCount = data.dropletCount || 0;
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
    this.universityId = data.universityId || null;
    this.moderators = data.moderators || [data.creatorId]; // Creator is automatically a moderator
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new bubble
  static async create(bubbleData) {
    try {
      const db = getDatabase();
      
      // Validate hashtag format
      if (!bubbleData.hashtag.startsWith('#')) {
        throw new ValidationError('Hashtag must start with #');
      }

      // Check if hashtag already exists within the same university
      const existingBubble = await db.get(
        'SELECT id FROM bubbles WHERE hashtag = ? AND universityId = ?',
        [bubbleData.hashtag, bubbleData.universityId || 'default']
      );

      if (existingBubble) {
        throw new ValidationError('Bubble with this hashtag already exists');
      }

      const bubble = new Bubble(bubbleData);
      
      // Insert into database
      const stmt = db.prepare(`
        INSERT INTO bubbles (
          id, name, hashtag, description, creatorId, memberCount, 
          dropletCount, isPublic, universityId, moderators, tags, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        bubble.id,
        bubble.name,
        bubble.hashtag,
        bubble.description,
        bubble.creatorId,
        bubble.memberCount,
        bubble.dropletCount,
        bubble.isPublic ? 1 : 0,
        bubble.universityId || 'default',
        JSON.stringify(bubble.moderators),
        JSON.stringify(bubble.tags),
        bubble.createdAt,
        bubble.updatedAt
      );

      // Add creator to bubble members
      await Bubble.addMember(bubble.id, bubble.creatorId);

      return bubble;
    } catch (error) {
      throw error;
    }
  }

  // Find bubble by ID
  static async findById(bubbleId) {
    try {
      const db = getDatabase();
      
      const row = await db.get(
        'SELECT * FROM bubbles WHERE id = ?',
        [bubbleId]
      );

      if (!row) {
        throw new NotFoundError('Bubble');
      }

      return Bubble.parseRow(row);
    } catch (error) {
      throw error;
    }
  }

  // Find bubble by hashtag
  static async findByHashtag(hashtag, universityId = null) {
    try {
      const db = getDatabase();
      
      let query = 'SELECT * FROM bubbles WHERE hashtag = ?';
      let params = [hashtag];

      if (universityId) {
        query += ' AND universityId = ?';
        params.push(universityId);
      }

      const row = await db.get(query, params);

      if (!row) {
        throw new NotFoundError('Bubble');
      }

      return Bubble.parseRow(row);
    } catch (error) {
      throw error;
    }
  }

  // Search bubbles
  static async search(searchTerm, options = {}) {
    try {
      const db = getDatabase();
      const {
        limit = 20,
        offset = 0,
        universityId = null,
        isPublic = null
      } = options;

      let query = `
        SELECT b.*, u.displayName as creatorName, u.avatarUrl as creatorAvatar
        FROM bubbles b
        LEFT JOIN users u ON b.creatorId = u.id
        WHERE 1=1
      `;
      let params = [];

      // Add search term filter
      if (searchTerm) {
        query += ` AND (
          b.name LIKE ? OR 
          b.description LIKE ? OR 
          b.hashtag LIKE ? OR
          json_extract(b.tags, '$') LIKE ?
        )`;
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      // Add university filter
      if (universityId) {
        query += ' AND b.universityId = ?';
        params.push(universityId);
      }

      // Add public filter
      if (isPublic !== null) {
        query += ' AND b.isPublic = ?';
        params.push(isPublic ? 1 : 0);
      }

      query += ' ORDER BY b.memberCount DESC, b.createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.all(query, params);
      return rows.map(row => Bubble.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Get user's joined bubbles
  static async getUserBubbles(userId, options = {}) {
    try {
      const db = getDatabase();
      const { limit = 20, offset = 0 } = options;

      const rows = await db.all(`
        SELECT b.*, ub.joinedAt as userJoinedAt
        FROM bubbles b
        INNER JOIN user_bubbles ub ON b.id = ub.bubbleId
        WHERE ub.userId = ?
        ORDER BY ub.joinedAt DESC, b.memberCount DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      return rows.map(row => Bubble.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Update bubble
  static async update(bubbleId, updateData) {
    try {
      const db = getDatabase();
      
      const existingBubble = await Bubble.findById(bubbleId);
      
      const updates = [];
      const params = [];

      // Build dynamic update query
      if (updateData.name !== undefined) {
        updates.push('name = ?');
        params.push(updateData.name);
      }
      
      if (updateData.description !== undefined) {
        updates.push('description = ?');
        params.push(updateData.description);
      }
      
      if (updateData.isPublic !== undefined) {
        updates.push('isPublic = ?');
        params.push(updateData.isPublic ? 1 : 0);
      }
      
      if (updateData.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(updateData.tags));
      }

      if (updates.length === 0) {
        return existingBubble; // No updates to make
      }

      updates.push('updatedAt = ?');
      params.push(new Date().toISOString());
      
      params.push(bubbleId);

      const query = `UPDATE bubbles SET ${updates.join(', ')} WHERE id = ?`;
      
      await db.run(query, params);
      
      // Return updated bubble
      return await Bubble.findById(bubbleId);
    } catch (error) {
      throw error;
    }
  }

  // Delete bubble
  static async delete(bubbleId, userId) {
    try {
      const db = getDatabase();
      
      // Check if user is creator or moderator
      const bubble = await Bubble.findById(bubbleId);
      
      if (!bubble.moderators.includes(userId)) {
        throw new ValidationError('Only moderators can delete bubbles');
      }

      // Start transaction
      await db.run('BEGIN TRANSACTION');

      try {
        // Remove bubble members
        await db.run('DELETE FROM user_bubbles WHERE bubbleId = ?', [bubbleId]);
        
        // Delete the bubble
        await db.run('DELETE FROM bubbles WHERE id = ?', [bubbleId]);
        
        await db.run('COMMIT');
        return true;
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Add member to bubble
  static async addMember(bubbleId, userId) {
    try {
      const db = getDatabase();
      
      // Check if user is already a member
      const existingMembership = await db.get(
        'SELECT userId FROM user_bubbles WHERE bubbleId = ? AND userId = ?',
        [bubbleId, userId]
      );

      if (existingMembership) {
        return false; // Already a member
      }

      // Add membership
      await db.run(`
        INSERT INTO user_bubbles (bubbleId, userId, joinedAt, role)
        VALUES (?, ?, ?, ?)
      `, [bubbleId, userId, new Date().toISOString(), 'member']);

      // Update member count
      await db.run(`
        UPDATE bubbles 
        SET memberCount = memberCount + 1, updatedAt = ?
        WHERE id = ?
      `, [new Date().toISOString(), bubbleId]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Remove member from bubble
  static async removeMember(bubbleId, userId) {
    try {
      const db = getDatabase();
      
      // Check if user is a member
      const membership = await db.get(
        'SELECT userId FROM user_bubbles WHERE bubbleId = ? AND userId = ?',
        [bubbleId, userId]
      );

      if (!membership) {
        return false; // Not a member
      }

      // Remove membership
      await db.run(`
        DELETE FROM user_bubbles WHERE bubbleId = ? AND userId = ?
      `, [bubbleId, userId]);

      // Update member count
      await db.run(`
        UPDATE bubbles 
        SET memberCount = memberCount - 1, updatedAt = ?
        WHERE id = ?
      `, [new Date().toISOString(), bubbleId]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is member of bubble
  static async isMember(bubbleId, userId) {
    try {
      const db = getDatabase();
      
      const membership = await db.get(
        'SELECT userId FROM user_bubbles WHERE bubbleId = ? AND userId = ?',
        [bubbleId, userId]
      );

      return !!membership;
    } catch (error) {
      throw error;
    }
  }

  // Check if user is moderator
  static async isModerator(bubbleId, userId) {
    try {
      const bubble = await Bubble.findById(bubbleId);
      return bubble.moderators.includes(userId);
    } catch (error) {
      throw error;
    }
  }

  // Get trending bubbles
  static async getTrending(options = {}) {
    try {
      const db = getDatabase();
      const {
        limit = 10,
        timeWindow = '7d', // 7 days default
        universityId = null
      } = options;

      // Calculate time condition
      let timeCondition = '';
      if (timeWindow === '24h') {
        timeCondition = "AND datetime('now', '-24 hours') <= b.createdAt";
      } else if (timeWindow === '7d') {
        timeCondition = "AND datetime('now', '-7 days') <= b.createdAt";
      } else if (timeWindow === '30d') {
        timeCondition = "AND datetime('now', '-30 days') <= b.createdAt";
      }

      let query = `
        SELECT b.*, 
               (b.memberCount * 2 + b.dropletCount) as popularity_score
        FROM bubbles b
        WHERE b.isPublic = 1
        ${timeCondition}
      `;

      let params = [];

      if (universityId) {
        query += ' AND b.universityId = ?';
        params.push(universityId);
      }

      query += ' ORDER BY popularity_score DESC, b.createdAt DESC LIMIT ?';
      params.push(limit);

      const rows = await db.all(query, params);
      return rows.map(row => Bubble.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Get bubble statistics
  static async getStats(bubbleId) {
    try {
      const db = getDatabase();
      
      const stats = await db.get(`
        SELECT 
          b.memberCount,
          b.dropletCount,
          COUNT(d.id) as activeMembers,
          COUNT(CASE WHEN d.createdAt > datetime('now', '-7 days') THEN 1 END) as recentDroplets
        FROM bubbles b
        LEFT JOIN user_bubbles ub ON b.id = ub.bubbleId
        LEFT JOIN droplets d ON b.id = d.bubbles AND d.deletedAt IS NULL
        WHERE b.id = ?
        GROUP BY b.id, b.memberCount, b.dropletCount
      `, [bubbleId]);

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Parse database row to Bubble object
  static parseRow(row) {
    return {
      id: row.id,
      name: row.name,
      hashtag: row.hashtag,
      description: row.description,
      creatorId: row.creatorId,
      memberCount: row.memberCount,
      dropletCount: row.dropletCount,
      isPublic: Boolean(row.isPublic),
      universityId: row.universityId,
      moderators: row.moderators ? JSON.parse(row.moderators) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      // Optional joined data from joins
      creatorName: row.creatorName,
      creatorAvatar: row.creatorAvatar,
      userJoinedAt: row.userJoinedAt,
      popularityScore: row.popularity_score,
      activeMembers: row.activeMembers,
      recentDroplets: row.recentDroplets
    };
  }

  // Convert to JSON (with options for different serialization levels)
  toJSON(includePrivate = false) {
    const data = {
      id: this.id,
      name: this.name,
      hashtag: this.hashtag,
      description: this.description,
      creatorId: this.creatorId,
      memberCount: this.memberCount,
      dropletCount: this.dropletCount,
      isPublic: this.isPublic,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Add optional fields if available
    if (this.creatorName) data.creatorName = this.creatorName;
    if (this.creatorAvatar) data.creatorAvatar = this.creatorAvatar;
    if (this.userJoinedAt) data.userJoinedAt = this.userJoinedAt;
    if (this.universityId) data.universityId = this.universityId;

    // Include private data only if requested and user has permission
    if (includePrivate) {
      data.moderators = this.moderators;
    }

    return data;
  }
}

module.exports = Bubble;