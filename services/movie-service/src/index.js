require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'movie-service';
const PORT = process.env.PORT || 4004;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Health check: tells us the service is alive
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

// GET all movies
app.get('/movies', async (req, res) => {
  try {
    const { status, genre } = req.query;
    let query = supabase.from('movies').select('*');
    
    if (status) query = query.eq('status', status);
    if (genre) query = query.eq('genre', genre);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single movie by ID
app.get('/movies/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new movie (protected)
app.post('/movies', authenticateToken, async (req, res) => {
  try {
    const { title, description, genre, language, duration_min, poster_url, trailer_url, rating, release_date, status } = req.body;
    
    const { data, error } = await supabase
      .from('movies')
      .insert({
        title,
        description,
        genre,
        language,
        duration_min,
        poster_url,
        trailer_url,
        rating,
        release_date,
        status: status || 'upcoming',
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update movie (protected)
app.put('/movies/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, genre, language, duration_min, poster_url, trailer_url, rating, release_date, status } = req.body;
    
    const { data, error } = await supabase
      .from('movies')
      .update({
        title,
        description,
        genre,
        language,
        duration_min,
        poster_url,
        trailer_url,
        rating,
        release_date,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE movie (protected)
app.delete('/movies/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler: catches mistakes so the service doesn't crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});
