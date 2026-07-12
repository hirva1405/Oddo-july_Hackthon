require('dotenv').config();

const express = require('express');
const cors = require('cors');

const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'TransitOps vehicle registry service is running.' });
});

app.use('/api/vehicles', vehicleRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`TransitOps vehicle registry service listening on http://localhost:${PORT}`);
});
