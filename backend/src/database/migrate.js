const db = require('./connection');

async function migrate() {
  try {
    // Ensure data directory exists
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../../../data');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    await db.connect();
    await db.migrate();
    console.log('Database migration completed successfully');
    await db.close();
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };