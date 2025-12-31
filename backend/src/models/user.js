const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { hashPassword, verifyPassword } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errors');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.email = data.email;
    this.displayName = data.displayName;
    this.avatarUrl = data.avatarUrl || null;
    this.role = data.role;
    this.universityId = data.universityId;
    this.department = data.department || null;
    this.yearOfStudy = data.yearOfStudy || null;
    this.preferences = data.preferences || this.getDefaultPreferences();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  getDefaultPreferences() {
    return JSON.stringify({
      emailNotifications: true,
      pushNotifications: true,
      hotseatOptIn: false,
      dataSharing: 'university'
    });
  }

  // Create new user
  static async create(userData) {
    try {
      // Validate required fields
      if (!userData.email || !userData.username || !userData.displayName || !userData.role) {
        throw new ValidationError('Missing required user fields');
      }

      // Check if email or username already exists
      const existingUser = await db.get(
        'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
        [userData.email, userData.username]
      );

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new ValidationError('Email already exists', 'email');
        }
        if (existingUser.username === userData.username) {
          throw new ValidationError('Username already exists', 'username');
        }
      }

      // Hash password if provided
      let hashedPassword = null;
      if (userData.password) {
        hashedPassword = await hashPassword(userData.password);
      }

      const user = new User({
        ...userData,
        preferences: JSON.stringify(user.getDefaultPreferences())
      });

      const result = await db.run(
        `INSERT INTO users (
          id, username, email, displayName, avatarUrl, role, 
          universityId, department, yearOfStudy, preferences, 
          createdAt, updatedAt, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.email,
          user.displayName,
          user.avatarUrl,
          user.role,
          user.universityId,
          user.department,
          user.yearOfStudy,
          user.preferences,
          user.createdAt,
          user.updatedAt,
          user.isActive
        ]
      );

      // Update user with joined bubbles (empty initially)
      user.joinedBubbles = [];

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const row = await db.get(
        `SELECT id, username, email, displayName, avatarUrl, role, 
         universityId, department, yearOfStudy, preferences, 
         createdAt, updatedAt, isActive
         FROM users WHERE id = ? AND isActive = 1`,
        [id]
      );

      if (!row) {
        throw new NotFoundError('User');
      }

      const user = new User(row);
      
      // Get joined bubbles
      const bubbles = await db.all(
        'SELECT bubbleId FROM user_bubbles WHERE userId = ?',
        [id]
      );
      user.joinedBubbles = bubbles.map(b => b.bubbleId);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const row = await db.get(
        `SELECT id, username, email, displayName, avatarUrl, role, 
         universityId, department, yearOfStudy, preferences, 
         createdAt, updatedAt, isActive
         FROM users WHERE email = ? AND isActive = 1`,
        [email]
      );

      if (!row) {
        return null;
      }

      const user = new User(row);
      
      // Get joined bubbles
      const bubbles = await db.all(
        'SELECT bubbleId FROM user_bubbles WHERE userId = ?',
        [row.id]
      );
      user.joinedBubbles = bubbles.map(b => b.bubbleId);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const row = await db.get(
        `SELECT id, username, email, displayName, avatarUrl, role, 
         universityId, department, yearOfStudy, preferences, 
         createdAt, updatedAt, isActive
         FROM users WHERE username = ? AND isActive = 1`,
        [username]
      );

      if (!row) {
        return null;
      }

      const user = new User(row);
      
      // Get joined bubbles
      const bubbles = await db.all(
        'SELECT bubbleId FROM user_bubbles WHERE userId = ?',
        [row.id]
      );
      user.joinedBubbles = bubbles.map(b => b.bubbleId);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new ValidationError('Invalid email or password');
      }

      // Get stored password hash
      const authRow = await db.get(
        'SELECT password FROM users WHERE id = ?',
        [user.id]
      );

      if (!authRow || !authRow.password) {
        throw new ValidationError('Invalid email or password');
      }

      // Verify password
      const isValid = await verifyPassword(password, authRow.password);
      if (!isValid) {
        throw new ValidationError('Invalid email or password');
      }

      // Return user without password
      delete user.password;
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updates) {
    try {
      // Build update query dynamically
      const allowedUpdates = ['displayName', 'avatarUrl', 'department', 'yearOfStudy', 'preferences', 'isActive'];
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

      updateFields.push('updatedAt = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const result = await db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      if (result.changes === 0) {
        throw new NotFoundError('User');
      }

      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Change password
  static async changePassword(id, currentPassword, newPassword) {
    try {
      // Get current password hash
      const authRow = await db.get(
        'SELECT password FROM users WHERE id = ? AND isActive = 1',
        [id]
      );

      if (!authRow) {
        throw new NotFoundError('User');
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, authRow.password);
      if (!isValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await db.run(
        'UPDATE users SET password = ?, updatedAt = ? WHERE id = ?',
        [hashedNewPassword, new Date().toISOString(), id]
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all users (with pagination and filtering)
  static async findAll(options = {}) {
    try {
      const { limit = 20, offset = 0, role, universityId } = options;
      
      let query = `
        SELECT id, username, email, displayName, avatarUrl, role, 
               universityId, department, yearOfStudy, preferences, 
               createdAt, updatedAt, isActive
        FROM users WHERE isActive = 1
      `;
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (universityId) {
        query += ' AND universityId = ?';
        params.push(universityId);
      }

      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const rows = await db.all(query, params);
      
      // Add joined bubbles to each user
      const users = await Promise.all(rows.map(async (row) => {
        const user = new User(row);
        const bubbles = await db.all(
          'SELECT bubbleId FROM user_bubbles WHERE userId = ?',
          [row.id]
        );
        user.joinedBubbles = bubbles.map(b => b.bubbleId);
        return user;
      }));

      return users;
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON response format
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      role: this.role,
      universityId: this.universityId,
      department: this.department,
      yearOfStudy: this.yearOfStudy,
      joinedBubbles: this.joinedBubbles || [],
      preferences: typeof this.preferences === 'string' ? JSON.parse(this.preferences) : this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive
    };
  }
}

module.exports = User;