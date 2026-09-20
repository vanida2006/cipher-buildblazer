// usage: node scripts/make-admin.js <username> <password>
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../server/db');

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 10) {
  console.error('Usage: node scripts/make-admin.js <username> <password (min 10 chars)>');
  process.exit(1);
}
db.prepare(
  `INSERT INTO admins (username, password_hash) VALUES (?, ?)
   ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`
).run(username, bcrypt.hashSync(password, 12));
console.log(`Admin "${username}" saved.`);
