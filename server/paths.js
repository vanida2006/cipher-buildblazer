const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cipher.db');
const dataDir = path.dirname(dbPath);
const uploadDir = process.env.UPLOAD_DIR || path.join(dataDir, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

module.exports = { dbPath, dataDir, uploadDir };
