const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all submissions (Admin sees all, Employee sees their own)
router.get('/', authMiddleware, (req, res) => {
  const role = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').get(req.user.id);
  
  let submissions;
  if (role?.role === 'admin') {
    submissions = db.prepare(`
      SELECT s.*, f.title as form_title, p.full_name as user_name 
      FROM submissions s
      JOIN forms f ON s.form_id = f.id
      JOIN profiles p ON s.user_id = p.id
      ORDER BY s.created_at DESC
    `).all();
  } else {
    submissions = db.prepare(`
      SELECT s.*, f.title as form_title
      FROM submissions s
      JOIN forms f ON s.form_id = f.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);
  }
  
  submissions.forEach(s => {
    s.answers = JSON.parse(s.answers);
  });
  
  res.json(submissions);
});

// Get submissions for a specific form (Admin only)
router.get('/form/:formId', authMiddleware, adminMiddleware, (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, p.full_name as user_name, p.email as user_email
    FROM submissions s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.form_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.formId);

  submissions.forEach(s => {
    s.answers = JSON.parse(s.answers);
  });

  res.json(submissions);
});

// Submit a form
router.post('/', authMiddleware, (req, res) => {
  const { form_id, answers } = req.body;
  const id = uuidv4();
  
  db.prepare('INSERT INTO submissions (id, form_id, user_id, answers) VALUES (?, ?, ?, ?)')
    .run(id, form_id, req.user.id, JSON.stringify(answers));
    
  res.status(201).json({ id, form_id, message: 'Submission received' });
});

module.exports = router;
