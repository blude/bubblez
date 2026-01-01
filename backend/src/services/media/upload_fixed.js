const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { ValidationError } = require('../middleware/errors');
const { logger } = require('../middleware/errors');

// Ensure upload directory exists
const uploadDir = config.media.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create fixed upload service
const uploadService = {
  // Media upload service (without config import issues)
  processFiles: async (files, options = {}) => {
    const processedFiles = [];
    
    for (const file of files) {
      const processedFile = {
        id: file.filename,
        type: file.mimetype.split('/')[0], // Simple type extraction
        url: `/uploads/${file.filename}`,
        thumbnailUrl: file.mimetype.startsWith('image/') ? `/uploads/${file.filename}` : null,
        size: file.size,
        mimeType: file.mimeType
      };
      processedFiles.push(processedFile);
    }
    
    return processedFiles;
  }
};

module.exports = uploadService;
