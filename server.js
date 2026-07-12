require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'TransitOps auth service is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', demoRoutes); // example RBAC-protected routes, one per role

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler (catches anything thrown/next(err)'d downstream)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TransitOps auth backend listening on http://localhost:${PORT}`);
});
