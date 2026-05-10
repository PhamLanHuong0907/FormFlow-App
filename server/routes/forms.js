const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all forms
router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM forms';
  let params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY order_index ASC, created_at DESC';
  
  const forms = db.prepare(query).all(...params);
  res.json(forms);
});

// Get only active forms (for Employees)
router.get('/active', authMiddleware, (req, res) => {
  const forms = db.prepare('SELECT * FROM forms WHERE status = "active" ORDER BY order_index ASC, created_at DESC').all();
  res.json(forms);
});

// Get single form with fields
router.get('/:id', authMiddleware, (req, res) => {
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  
  const fields = db.prepare('SELECT * FROM fields WHERE form_id = ? ORDER BY order_index ASC').all(req.params.id);
  
  // Parse options JSON
  fields.forEach(f => {
    if (f.options) f.options = JSON.parse(f.options);
  });
  
  res.json({ ...form, fields });
});

// Create form (Admin only)
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, status } = req.body;
  const id = uuidv4();
  
  db.prepare('INSERT INTO forms (id, title, description, status, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, description || '', status || 'draft', req.user.id);
    
  res.status(201).json({ id, title, description, status });
});

// Update form (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { title, description, status, order_index } = req.body;
  
  db.prepare('UPDATE forms SET title = ?, description = ?, status = ?, order_index = ? WHERE id = ?')
    .run(title, description, status, order_index || 0, req.params.id);
    
  res.json({ message: 'Form updated' });
});

// Delete form (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM forms WHERE id = ?').run(req.params.id);
  res.json({ message: 'Form deleted' });
});

// Submit form answers
router.post('/:id/submit', authMiddleware, (req, res) => {
  const { answers } = req.body;
  const formId = req.params.id;
  const id = uuidv4();
  
  db.prepare('INSERT INTO submissions (id, form_id, user_id, answers) VALUES (?, ?, ?, ?)')
    .run(id, formId, req.user.id, JSON.stringify(answers));
    
  res.status(201).json({ id, formId, message: 'Submission received' });
});

// Update all fields (Replace all)
router.post('/:id/fields', authMiddleware, adminMiddleware, (req, res) => {
  const { fields } = req.body;
  const formId = req.params.id;
  
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM fields WHERE form_id = ?').run(formId);
    const insertField = db.prepare('INSERT INTO fields (id, form_id, label, type, required, order_index, options) VALUES (?, ?, ?, ?, ?, ?, ?)');
    fields.forEach((f, idx) => {
      insertField.run(f.id || uuidv4(), formId, f.label, f.type, f.required ? 1 : 0, f.order_index || idx, f.options ? JSON.stringify(f.options) : null);
    });
  });
  transaction();
  res.json({ message: 'Fields updated' });
});

// Add single field
router.post('/fields', authMiddleware, adminMiddleware, (req, res) => {
  const { form_id, label, type, order_index, required, options } = req.body;
  const id = uuidv4();
  
  const targetOrder = order_index !== undefined ? order_index : 0;

  // Auto-shift: Push existing fields down if targetOrder is taken or higher
  db.prepare('UPDATE fields SET order_index = order_index + 1 WHERE form_id = ? AND order_index >= ?')
    .run(form_id, targetOrder);

  db.prepare('INSERT INTO fields (id, form_id, label, type, required, order_index, options) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, form_id, label, type, required ? 1 : 0, targetOrder, options ? JSON.stringify(options) : null);
    
  res.status(201).json({ id, form_id, label, type, required, order_index: targetOrder, options });
});

// Update single field
router.put('/fields/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { label, type, required, order_index, options } = req.body;
  const current = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Field not found' });

  const newOrder = order_index !== undefined ? order_index : current.order_index;
  const oldOrder = current.order_index;

  // If order changed, shift other fields
  if (order_index !== undefined && newOrder !== oldOrder) {
    if (newOrder > oldOrder) {
      // Moving Down: decrement fields between old and new positions
      db.prepare('UPDATE fields SET order_index = order_index - 1 WHERE form_id = ? AND id != ? AND order_index > ? AND order_index <= ?')
        .run(current.form_id, req.params.id, oldOrder, newOrder);
    } else {
      // Moving Up: increment fields between new and old positions
      db.prepare('UPDATE fields SET order_index = order_index + 1 WHERE form_id = ? AND id != ? AND order_index >= ? AND order_index < ?')
        .run(current.form_id, req.params.id, newOrder, oldOrder);
    }
  }

  db.prepare('UPDATE fields SET label = ?, type = ?, required = ?, order_index = ?, options = ? WHERE id = ?')
    .run(
      label !== undefined ? label : current.label,
      type !== undefined ? type : current.type,
      required !== undefined ? (required ? 1 : 0) : current.required,
      newOrder,
      options !== undefined ? JSON.stringify(options) : current.options,
      req.params.id
    );
  res.json({ message: 'Field updated' });
});

// Delete single field
router.delete('/fields/:id', authMiddleware, adminMiddleware, (req, res) => {
  const current = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Field not found' });

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM fields WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE fields SET order_index = order_index - 1 WHERE form_id = ? AND order_index > ?')
      .run(current.form_id, current.order_index);
  });
  transaction();
  
  res.json({ message: 'Field deleted' });
});

module.exports = router;
