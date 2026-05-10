const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const email = 'admin@example.com';
  const password = 'adminpassword';
  const fullName = 'Admin User';
  
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)').run(userId, email, passwordHash);
    db.prepare('INSERT INTO profiles (id, full_name, email) VALUES (?, ?, ?)').run(userId, fullName, email);
    db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)').run(uuidv4(), userId, 'admin');
  });

  transaction();
  console.log(`Admin user created: ${email} / ${password}`);
}

module.exports = seed;
