const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const { ValidationError } = require('../../middleware/errors');
const { logger } = require('../../middleware/errors');

// Ensure upload directory exists
const uploadDir = config.media.uploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.media.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Invalid file type: ${file.mimetype}`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.media.maxFileSize,
    files: 10 // Maximum 10 files per request
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware for multiple files upload
const uploadMultiple = upload.array('files', 10);

// File processing utilities
const processUploadedFile = (file) => {
  const publicUrl = `/uploads/${file.filename}`;
  const thumbnailUrl = generateThumbnailUrl(file);
  
  return {
    id: file.filename, // Use filename as ID for now
    type: getFileType(file.mimetype),
    url: publicUrl,
    thumbnailUrl,
    size: file.size,
    mimeType: file.mimeType
  };
};

const generateThumbnailUrl = (file) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (imageTypes.includes(file.mimetype)) {
    // For images, use the same URL as thumbnail
    return `/uploads/${file.filename}`;
  }
  
  // For other file types, could generate placeholder thumbnails
  return null;
};

const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  return 'document';
};

// File deletion utility
const deleteFile = async (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Deleted file: ${filename}`);
    }
  } catch (error) {
    logger.error(`Error deleting file ${filename}:`, error);
  }
};

// File validation middleware
const validateMediaFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No files uploaded',
      code: 'NO_FILES'
    });
  }

  const files = req.files || [req.file];
  const oversizedFiles = files.filter(file => file.size > config.media.maxFileSize);
  
  if (oversizedFiles.length > 0) {
    // Clean up oversized files
    oversizedFiles.forEach(file => {
      deleteFile(file.filename);
    });
    
    return res.status(413).json({
      error: 'One or more files are too large',
      code: 'FILES_TOO_LARGE',
      maxSize: config.media.maxFileSize
    });
  }

  const invalidFiles = files.filter(file => 
    !config.media.allowedFileTypes.includes(file.mimetype)
  );
  
  if (invalidFiles.length > 0) {
    // Clean up invalid files
    invalidFiles.forEach(file => {
      deleteFile(file.filename);
    });
    
    return res.status(400).json({
      error: 'One or more files have invalid types',
      code: 'INVALID_FILE_TYPES',
      allowedTypes: config.media.allowedFileTypes
    });
  }

  next();
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let code = 'UPLOAD_ERROR';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
    }
    
    return res.status(400).json({
      error: message,
      code,
      ...(error.limit && { limit: error.limit })
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  processUploadedFile,
  deleteFile,
  validateMediaFile,
  handleUploadError,
  generateThumbnailUrl,
  getFileType
};