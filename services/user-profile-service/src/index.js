require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'user-profile-service';
const PORT = process.env.PORT || 4002;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Health check
app.get('/health', (req, res) => {
  res.json({ service: SERVICE_NAME, status: 'ok' });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// GET user profile by user_id
app.get('/profiles/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, users(*)')
      .eq('user_id', req.params.user_id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user profile (protected)
app.post('/profiles', authenticateToken, async (req, res) => {
  try {
    const { date_of_birth, gender, address, city, country, preferred_language, profile_image_url, preferences } = req.body;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: req.user.userId,
        date_of_birth,
        gender,
        address,
        city,
        country: country || 'Bhutan',
        preferred_language: preferred_language || 'Dzongkha',
        profile_image_url,
        preferences: preferences || {},
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user profile (protected)
app.put('/profiles/:user_id', authenticateToken, async (req, res) => {
  try {
    const { date_of_birth, gender, address, city, country, preferred_language, profile_image_url, preferences } = req.body;
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        date_of_birth,
        gender,
        address,
        city,
        country,
        preferred_language,
        profile_image_url,
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', req.params.user_id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user profile (protected)
app.delete('/profiles/:user_id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', req.params.user_id);
    
    if (error) throw error;
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
