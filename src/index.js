// server

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const jwt = require('jsonwebtoken');

// ==== Middleware ====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());

// ==== MongoDB Connection ====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_management';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// ==== Routes ====

app.get('/', (req, res) => {
  res.send('🌍 BHRL Tour Management API is running!');
});


app.post('/jwt', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Create JWT token
  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.json({ token });
});



// ==== Start Server ====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});