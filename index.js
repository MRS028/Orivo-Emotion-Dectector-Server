// server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// ==== Middleware ====
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

// ==== MongoDB Connection ====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tour_management';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// ==== Schemas & Models ====

// User Schema (no password, keep emotion history separate)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Emotion Schema (linked to user)
const emotionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  detectedEmotion: { type: String, required: true },
  email: { type: String, required: true },
}, { timestamps: true });

const Emotion = mongoose.model('Emotion', emotionSchema);

// ==== Routes ====

// Welcome
app.get('/', (req, res) => res.send('🌍 Emotion Detection API is running!'));

// --- User Routes ---

// Register user
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==== Emotion Routes ====

// Get emotions by email - UPDATED with userId
app.get('/api/emotions', async (req, res) => {
  try {
    const { email } = req.query;
    // console.log('Fetching emotions for email:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    // First find the user by email to get userId
    const user = await User.findOne({ email });
    // console.log('Found user:', user);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Then find emotions by userId
    const emotions = await Emotion.find({ userId: user._id })
      .sort({ createdAt: -1 });

    // console.log('Found emotions:', emotions.length);
    res.json(emotions);
  } catch (error) {
    // console.error('Error fetching emotions:', error);
    res.status(500).json({ error: 'Failed to fetch emotions' });
  }
});

// Save emotion (already correct)
app.post('/api/emotions', async (req, res) => {
//   console.log("Request body:", req.body); // check
  try {
    const { email, text, detectedEmotion } = req.body;
    if (!email || !text || !detectedEmotion) {
      return res.status(400).json({ error: 'Email, text and detectedEmotion are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const emotion = await Emotion.create({
      userId: user._id, 
      text,
      detectedEmotion,
      email: user.email
    });

    // console.log('Emotion saved:', emotion);
    res.status(201).json(emotion);
  } catch (err) {
    // console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete emotion by ID
app.delete('/api/emotions/:id', async (req, res) => {
  try {
    await Emotion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Emotion deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete emotion' });
  }
});

// Clear all emotions for a user
app.delete('/api/emotions', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Emotion.deleteMany({ userId: user._id });
    res.json({ message: 'All emotions cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear emotions' });
  }
});
// ==== Start Server ====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
