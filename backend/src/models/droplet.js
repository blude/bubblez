const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { NotFoundError, ValidationError } = require('../middleware/errors');

class Droplet {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.authorId = data.authorId;
    this.content = data.content;
    this.mediaAttachments = data.mediaAttachments || [];
    this.bubbles = data.bubbles || [];
    this.mentions = data.mentions || [];
    this.replyToId = data.replyToId || null;
    this.interactions = data.interactions || this.getDefaultInteractions();
    this.universityData = data.universityData || null;
    this.visibility = data.visibility || 'university';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deletedAt || null;
  }

  getDefaultInteractions() {
    return JSON.stringify({
      upvotes: 0,
      downvotes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      badges: []
    });
  }

  // Create new droplet
  static async create(dropletData) {
    try {
      // Validate required fields
      if (!dropletData.authorId || !dropletData.content) {
        throw new ValidationError('Missing required droplet fields');
      }

      // Parse content for hashtags and mentions
      const parsedContent = Droplet.parseContent(dropletData.content);
      
      const droplet = new Droplet({
        ...dropletData,
        bubbles: [...new Set([...(dropletData.bubbles || []), ...parsedContent.bubbles])],
        mentions: [...new Set([...(dropletData.mentions || []), ...parsedContent.mentions])]
      });

      const result = await db.run(
        `INSERT INTO droplets (
          id, authorId, content, mediaAttachments, bubbles, mentions,
          replyToId, interactions, universityData, visibility, 
          createdAt, updatedAt, deletedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          droplet.id,
          droplet.authorId,
          droplet.content,
          JSON.stringify(droplet.mediaAttachments),
          JSON.stringify(droplet.bubbles),
          JSON.stringify(droplet.mentions),
          droplet.replyToId,
          droplet.interactions,
          droplet.universityData ? JSON.stringify(droplet.universityData) : null,
          droplet.visibility,
          droplet.createdAt,
          droplet.updatedAt,
          droplet.deletedAt
        ]
      );

      // If media attachments exist, create them
      if (droplet.mediaAttachments && droplet.mediaAttachments.length > 0) {
        await Droplet.createMediaAttachments(droplet.id, droplet.mediaAttachments);
      }

      return await Droplet.findById(droplet.id);
    } catch (error) {
      throw error;
    }
  }

  // Find droplet by ID
  static async findById(id, includeDeleted = false) {
    try {
      let query = `
        SELECT id, authorId, content, mediaAttachments, bubbles, mentions,
               replyToId, interactions, universityData, visibility,
               createdAt, updatedAt, deletedAt
        FROM droplets WHERE id = ?
      `;
      
      if (!includeDeleted) {
        query += ' AND deletedAt IS NULL';
      }

      const row = await db.get(query, [id]);

      if (!row) {
        throw new NotFoundError('Droplet');
      }

      return Droplet.parseRow(row);
    } catch (error) {
      throw error;
    }
  }

  // Find multiple droplets with pagination
  static async findMany(options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        authorId,
        bubbles,
        visibility,
        includeReplies = true,
        userId // For personalized feed
      } = options;

      let whereClauses = ['deletedAt IS NULL'];
      let params = [];

      if (authorId) {
        whereClauses.push('authorId = ?');
        params.push(authorId);
      }

      if (bubbles && bubbles.length > 0) {
        const bubblePlaceholders = bubbles.map(() => 'json_extract(bubbles, $) LIKE ?').join(' OR ');
        whereClauses.push(`(${bubblePlaceholders})`);
        bubbles.forEach(bubble => {
          params.push(`%${bubble}%`);
        });
      }

      if (visibility) {
        if (Array.isArray(visibility)) {
          const visibilityPlaceholders = visibility.map(() => '?').join(',');
          whereClauses.push(`visibility IN (${visibilityPlaceholders})`);
          params.push(...visibility);
        } else {
          whereClauses.push('visibility = ?');
          params.push(visibility);
        }
      }

      if (!includeReplies) {
        whereClauses.push('replyToId IS NULL');
      }

      // For personalized feed, prioritize user's joined bubbles
      if (userId) {
        // This will be enhanced when bubble membership is implemented
        whereClauses.push('(visibility = "public" OR visibility = "university" OR authorId = ?)');
        params.push(userId);
      }

      const query = `
        SELECT id, authorId, content, mediaAttachments, bubbles, mentions,
               replyToId, interactions, universityData, visibility,
               createdAt, updatedAt, deletedAt
        FROM droplets 
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const rows = await db.all(query, params);
      
      return rows.map(row => Droplet.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Update droplet
  static async update(id, updates) {
    try {
      const allowedUpdates = ['content', 'mediaAttachments', 'bubbles', 'mentions', 'visibility', 'universityData'];
      const updateFields = [];
      const updateValues = [];

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key] !== undefined) {
          if (key === 'content') {
            // Parse updated content for hashtags and mentions
            const parsed = Droplet.parseContent(updates[key]);
            updateFields.push('content = ?, bubbles = ?, mentions = ?');
            updateValues.push(updates[key], JSON.stringify(parsed.bubbles), JSON.stringify(parsed.mentions));
          } else if (key === 'mediaAttachments' || key === 'bubbles' || key === 'mentions' || key === 'universityData') {
            updateFields.push(`${key} = ?`);
            updateValues.push(JSON.stringify(updates[key]));
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(updates[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      updateFields.push('updatedAt = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const result = await db.run(
        `UPDATE droplets SET ${updateFields.join(', ')} WHERE id = ? AND deletedAt IS NULL`,
        updateValues
      );

      if (result.changes === 0) {
        throw new NotFoundError('Droplet');
      }

      return await Droplet.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete droplet (soft delete)
  static async delete(id, userId) {
    try {
      // Check if user owns the droplet
      const droplet = await Droplet.findById(id);
      if (droplet.authorId !== userId) {
        throw new ValidationError('You can only delete your own droplets');
      }

      const result = await db.run(
        'UPDATE droplets SET deletedAt = ?, updatedAt = ? WHERE id = ?',
        [new Date().toISOString(), new Date().toISOString(), id]
      );

      if (result.changes === 0) {
        throw new NotFoundError('Droplet');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get droplet replies
  static async getReplies(dropletId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      const rows = await db.all(
        `SELECT id, authorId, content, mediaAttachments, bubbles, mentions,
                replyToId, interactions, universityData, visibility,
                createdAt, updatedAt, deletedAt
         FROM droplets 
         WHERE replyToId = ? AND deletedAt IS NULL
         ORDER BY createdAt ASC 
         LIMIT ? OFFSET ?`,
        [dropletId, limit, offset]
      );

      return rows.map(row => Droplet.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Search droplets
  static async search(searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0, userId } = options;

      const query = `
        SELECT id, authorId, content, mediaAttachments, bubbles, mentions,
               replyToId, interactions, universityData, visibility,
               createdAt, updatedAt, deletedAt
        FROM droplets 
        WHERE deletedAt IS NULL 
          AND content LIKE ? 
          AND (visibility = 'public' OR visibility = 'university' OR authorId = ?)
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `;

      const rows = await db.all(
        query,
        [`%${searchTerm}%`, userId || '', limit, offset]
      );

      return rows.map(row => Droplet.parseRow(row));
    } catch (error) {
      throw error;
    }
  }

  // Parse content for hashtags and mentions
  static parseContent(content) {
    const hashtags = content.match(/#\w+/g) || [];
    const mentions = content.match(/@\w+/g) || [];

    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());
    const cleanMentions = mentions.map(mention => mention.substring(1).toLowerCase());

    return {
      bubbles: cleanHashtags,
      mentions: cleanMentions
    };
  }

  // Create media attachments
  static async createMediaAttachments(dropletId, attachments) {
    try {
      for (const attachment of attachments) {
        await db.run(
          `INSERT INTO media_attachments (
            id, type, url, thumbnailUrl, size, mimeType, dropletId, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attachment.id,
            attachment.type,
            attachment.url,
            attachment.thumbnailUrl,
            attachment.size,
            attachment.mimeType,
            dropletId,
            new Date().toISOString()
          ]
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Parse database row to Droplet object
  static parseRow(row) {
    const droplet = new Droplet({
      ...row,
      mediaAttachments: row.mediaAttachments ? JSON.parse(row.mediaAttachments) : [],
      bubbles: row.bubbles ? JSON.parse(row.bubbles) : [],
      mentions: row.mentions ? JSON.parse(row.mentions) : [],
      interactions: row.interactions ? JSON.parse(row.interactions) : {},
      universityData: row.universityData ? JSON.parse(row.universityData) : null
    });

    return droplet;
  }

  // Convert to JSON response format
  toJSON(includeAuthor = false) {
    const data = {
      id: this.id,
      content: this.content,
      mediaAttachments: this.mediaAttachments,
      bubbles: this.bubbles,
      mentions: this.mentions,
      replyToId: this.replyToId,
      interactions: this.interactions,
      universityData: this.universityData,
      visibility: this.visibility,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    if (includeAuthor) {
      // Author info will be loaded separately to avoid circular dependencies
      data.author = {
        id: this.authorId
        // Author details will be populated by service layer
      };
    }

    return data;
  }
}

module.exports = Droplet;