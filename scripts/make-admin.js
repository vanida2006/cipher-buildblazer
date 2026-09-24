// Usage: node scripts/make-admin.js <username> <password> [ROLE] [name] [email]
//   ROLE is one of SUPER_ADMIN (default), EVENT_MANAGER, CONTENT_MANAGER
// Use this to create the first Super Admin, or any additional admin account.
// Re-running with an existing username updates that account's password/role/profile.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../server/db');

const ROLES = ['SUPER_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER'];
const [username, password, roleArg, name, email] = process.argv.slice(2);
const role = (roleArg || 'SUPER_ADMIN').toUpperCase();

if (!username || !password || password.length < 10) {
  console.error('Usage: node scripts/make-admin.js <username> <password (min 10 chars)> [ROLE] [name] [email]');
  console.error(`ROLE must be one of: ${ROLES.join(', ')}`);
  process.exit(1);
}
if (!ROLES.includes(role)) {
  console.error(`Invalid role "${role}". Must be one of: ${ROLES.join(', ')}`);
  process.exit(1);
}

db.prepare(
  `INSERT INTO admins (username, password_hash, role, name, email, status)
   VALUES (?, ?, ?, ?, ?, 'active')
   ON CONFLICT(username) DO UPDATE SET
     password_hash = excluded.password_hash,
     role = excluded.role,
     name = COALESCE(excluded.name, admins.name),
     email = COALESCE(excluded.email, admins.email)`
).run(username, bcrypt.hashSync(password, 12), role, name || null, email || null);

console.log(`Admin "${username}" saved with role ${role}.`);
