const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { email, password, full_name, role } = req.body;
  
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const insertUser = db.prepare('INSERT INTO users (id, email, password) VALUES (?, ?, ?)');
    const insertProfile = db.prepare('INSERT INTO profiles (id, full_name, email) VALUES (?, ?, ?)');
    const insertRole = db.prepare('INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)');
    
    const transaction = db.transaction(() => {
      insertUser.run(userId, email, passwordHash);
      insertProfile.run(userId, full_name, email);
      insertRole.run(uuidv4(), userId, role || 'sw_employee');
    });
    
    transaction();
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  const roleData = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').get(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, role: roleData?.role }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ token, user: { id: user.id, email: user.email }, role: roleData?.role });
});

router.get('/me', authMiddleware, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.id);
  const roleData = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').get(req.user.id);
  res.json({ user: profile, role: roleData?.role });
});

module.exports = router;
