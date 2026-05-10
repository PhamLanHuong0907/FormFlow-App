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

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/submissions', submissionsRoutes);

// 404 Handler for API (matches anything starting with /api that wasn't handled above)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Path not found: ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
