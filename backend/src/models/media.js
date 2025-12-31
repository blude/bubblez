const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { NotFoundError, ValidationError } = require('../middleware/errors');

class MediaAttachment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.type = data.type;
    this.url = data.url;
    this.thumbnailUrl = data.thumbnailUrl || null;
    this.size = data.size;
    this.mimeType = data.mimeType;
    this.dropletId = data.dropletId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Create new media attachment
  static async create(attachmentData) {
    try {
      // Validate required fields
      if (!attachmentData.type || !attachmentData.url || !attachmentData.mimeType) {
        throw new ValidationError('Missing required media attachment fields');
      }

      const attachment = new MediaAttachment(attachmentData);

      const result = await db.run(
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
          attachment.dropletId,
          attachment.createdAt
        ]
      );

      return await MediaAttachment.findById(attachment.id);
    } catch (error) {
      throw error;
    }
  }

  // Find media attachment by ID
  static async findById(id) {
    try {
      const row = await db.get(
        `SELECT id, type, url, thumbnailUrl, size, mimeType, dropletId, createdAt
         FROM media_attachments WHERE id = ?`,
        [id]
      );

      if (!row) {
        throw new NotFoundError('Media attachment');
      }

      return new MediaAttachment(row);
    } catch (error) {
      throw error;
    }
  }

  // Find media attachments by droplet ID
  static async findByDropletId(dropletId) {
    try {
      const rows = await db.all(
        `SELECT id, type, url, thumbnailUrl, size, mimeType, dropletId, createdAt
         FROM media_attachments WHERE dropletId = ?
         ORDER BY createdAt ASC`,
        [dropletId]
      );

      return rows.map(row => new MediaAttachment(row));
    } catch (error) {
      throw error;
    }
  }

  // Delete media attachment
  static async delete(id, userId = null) {
    try {
      // Check if user has permission (if userId provided)
      if (userId) {
        const attachment = await MediaAttachment.findById(id);
        if (attachment.dropletId) {
          // Check if user owns the associated droplet
          const dropletRow = await db.get(
            'SELECT authorId FROM droplets WHERE id = ?',
            [attachment.dropletId]
          );
          
          if (!dropletRow || dropletRow.authorId !== userId) {
            throw new ValidationError('You can only delete media attachments from your own droplets');
          }
        }
      }

      const result = await db.run(
        'DELETE FROM media_attachments WHERE id = ?',
        [id]
      );

      if (result.changes === 0) {
        throw new NotFoundError('Media attachment');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Delete media attachments by droplet ID
  static async deleteByDropletId(dropletId, userId = null) {
    try {
      // Check permission if userId provided
      if (userId) {
        const dropletRow = await db.get(
          'SELECT authorId FROM droplets WHERE id = ?',
          [dropletId]
        );
        
        if (!dropletRow || dropletRow.authorId !== userId) {
          throw new ValidationError('You can only delete media attachments from your own droplets');
        }
      }

      const result = await db.run(
        'DELETE FROM media_attachments WHERE dropletId = ?',
        [dropletId]
      );

      return result.changes;
    } catch (error) {
      throw error;
    }
  }

  // Update media attachment
  static async update(id, updates) {
    try {
      const allowedUpdates = ['thumbnailUrl', 'type'];
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
        `UPDATE media_attachments SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.changes === 0) {
        throw new NotFoundError('Media attachment');
      }

      return await MediaAttachment.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Get media attachment stats
  static async getStats(options = {}) {
    try {
      const { type, startDate, endDate } = options;

      let whereClauses = [];
      let params = [];

      if (type) {
        whereClauses.push('type = ?');
        params.push(type);
      }

      if (startDate) {
        whereClauses.push('createdAt >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereClauses.push('createdAt <= ?');
        params.push(endDate);
      }

      const whereClause = whereClauses.length > 0 ? 
        `WHERE ${whereClauses.join(' AND ')}` : '';

      const query = `
        SELECT 
          type,
          COUNT(*) as count,
          SUM(size) as totalSize,
          AVG(size) as avgSize,
          MIN(size) as minSize,
          MAX(size) as maxSize
        FROM media_attachments 
        ${whereClause}
        GROUP BY type
        ORDER BY count DESC
      `;

      const rows = await db.all(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Validate file type
  static validateFileType(mimeType) {
    const validTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    return validTypes.includes(mimeType);
  }

  // Get media type from MIME type
  static getMediaTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
    return 'document';
  }

  // Convert to JSON response format
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      size: this.size,
      mimeType: this.mimeType,
      dropletId: this.dropletId,
      createdAt: this.createdAt
    };
  }
}

module.exports = MediaAttachment;