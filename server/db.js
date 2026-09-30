const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

function initDatabase() {
  const defaultPath = path.join(__dirname, 'database.sqlite');
  let finalPath = defaultPath;

  // Trên Vercel hoặc môi trường Serverless (thư mục code là read-only)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', 'database.sqlite');
    try {
      if (!fs.existsSync(tmpPath)) {
        if (fs.existsSync(defaultPath)) {
          fs.copyFileSync(defaultPath, tmpPath);
        }
      }
      finalPath = tmpPath;
    } catch (err) {
      console.error('Lỗi copy database sang /tmp:', err.message);
    }
  }

  try {
    return new Database(finalPath);
  } catch (err) {
    console.warn(`Không thể mở ${finalPath}, chuyển sang /tmp:`, err.message);
    const fallbackPath = path.join('/tmp', 'database.sqlite');
    return new Database(fallbackPath);
  }
}

const db = initDatabase();

// Enable foreign keys
try {
  db.pragma('foreign_keys = ON');
} catch (e) {
  console.warn('Pragma error:', e.message);
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'sw_employee')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('active', 'draft')) DEFAULT 'draft',
    created_by TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS fields (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'number', 'date', 'color', 'select', 'file', 'url')),
    required BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    options TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    answers TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;
