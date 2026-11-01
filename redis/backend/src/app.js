const express = require('express');
const cors = require('cors');

const authRoutes = require('../src/routes/authRoutes');
const app = express();

// Initial applications middleware settings
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Mount the authentication routes
app.use('/api/auth', authRoutes);

module.exports = app;