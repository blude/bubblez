const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database setup
const dbPath = path.join(__dirname, '../../../data/university_social.db');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database.');
          resolve();
        }
      });
    });
  }

  // Run database migrations
  async migrate() {
    const migrations = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        displayName TEXT NOT NULL,
        avatarUrl TEXT,
        role TEXT NOT NULL CHECK (role IN ('student', 'professor', 'staff')),
        universityId TEXT NOT NULL,
        department TEXT,
        yearOfStudy INTEGER,
        preferences TEXT, -- JSON
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN DEFAULT 1
      )`,

      // Droplets table
      `CREATE TABLE IF NOT EXISTS droplets (
        id TEXT PRIMARY KEY,
        authorId TEXT NOT NULL,
        content TEXT NOT NULL,
        mediaAttachments TEXT, -- JSON array
        bubbles TEXT, -- JSON array of bubble IDs
        mentions TEXT, -- JSON array of user IDs
        replyToId TEXT,
        interactions TEXT, -- JSON object with metrics
        universityData TEXT, -- JSON object
        visibility TEXT DEFAULT 'university' CHECK (visibility IN ('public', 'university', 'bubble', 'private')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (replyToId) REFERENCES droplets(id) ON DELETE CASCADE
      )`,

      // Bubbles table
      `CREATE TABLE IF NOT EXISTS bubbles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hashtag TEXT UNIQUE NOT NULL,
        description TEXT,
        creatorId TEXT NOT NULL,
        memberCount INTEGER DEFAULT 1,
        dropletCount INTEGER DEFAULT 0,
        isPublic BOOLEAN DEFAULT 1,
        universityId TEXT,
        moderators TEXT, -- JSON array of user IDs
        tags TEXT, -- JSON array
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // User-Bubble membership table
      `CREATE TABLE IF NOT EXISTS user_bubbles (
        userId TEXT NOT NULL,
        bubbleId TEXT NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, bubbleId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (bubbleId) REFERENCES bubbles(id) ON DELETE CASCADE
      )`,

      // Interactions table (for detailed tracking)
      `CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        dropletId TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('upvote', 'downvote', 'bookmark', 'share', 'badge')),
        badgeType TEXT, -- JSON for badge details
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (dropletId) REFERENCES droplets(id) ON DELETE CASCADE
      )`,

      // Media attachments table
      `CREATE TABLE IF NOT EXISTS media_attachments (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('image', 'video', 'document', 'audio')),
        url TEXT NOT NULL,
        thumbnailUrl TEXT,
        size INTEGER NOT NULL,
        mimeType TEXT NOT NULL,
        dropletId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dropletId) REFERENCES droplets(id) ON DELETE CASCADE
      )`,

      // University systems table
      `CREATE TABLE IF NOT EXISTS university_systems (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('e_learning', 'student_portal', 'intranet', 'public_portal', 'student_information_system')),
        config TEXT NOT NULL, -- JSON object
        status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'syncing')),
        lastSyncAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Hotseat games table
      `CREATE TABLE IF NOT EXISTS hotseat_games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'paused', 'completed')),
        createdBy TEXT NOT NULL,
        maxParticipants INTEGER NOT NULL,
        currentParticipants INTEGER DEFAULT 0,
        roundDuration INTEGER NOT NULL,
        currentRound INTEGER DEFAULT 0,
        totalRounds INTEGER NOT NULL,
        settings TEXT, -- JSON object
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        startedAt DATETIME,
        endedAt DATETIME,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Hotseat game participants table
      `CREATE TABLE IF NOT EXISTS hotseat_participants (
        id TEXT PRIMARY KEY,
        gameId TEXT NOT NULL,
        userId TEXT NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        currentGroup TEXT, -- Group ID for current round
        totalScore INTEGER DEFAULT 0,
        FOREIGN KEY (gameId) REFERENCES hotseat_games(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    return new Promise((resolve, reject) => {
      let completed = 0;
      
      migrations.forEach((migration, index) => {
        this.db.run(migration, (err) => {
          if (err) {
            console.error(`Error running migration ${index + 1}:`, err.message);
            reject(err);
          } else {
            completed++;
            if (completed === migrations.length) {
              console.log('All database migrations completed successfully.');
              resolve();
            }
          }
        });
      });
    });
  }

  // Generic query runner
  async run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Generic get single row
  async get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Generic get all rows
  async all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed.');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();