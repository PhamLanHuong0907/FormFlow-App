require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const formsRoutes = require('./routes/forms');
const submissionsRoutes = require('./routes/submissions');
const seed = require('./seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Run database seeding
seed().catch(err => console.error('Seeding failed:', err));

// CORS Middleware toàn diện: xử lý preflight OPTIONS và cấp header cho mọi origin
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors());
app.use(express.json());

// Routes (Hỗ trợ cả có /api và không có /api để tránh 404)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/forms', formsRoutes);
app.use('/forms', formsRoutes);

app.use('/api/submissions', submissionsRoutes);
app.use('/submissions', submissionsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Path not found: ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
module.exports = app;