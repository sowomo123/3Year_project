require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'review-rating-service';
const PORT = process.env.PORT || 4014;
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

// GET all reviews
app.get('/reviews', async (req, res) => {
  try {
    const { movie_id, user_id, rating, is_approved } = req.query;
    let query = supabase.from('reviews').select('*, movies(*), users(*)');
    
    if (movie_id) query = query.eq('movie_id', movie_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (rating) query = query.eq('rating', rating);
    if (is_approved) query = query.eq('is_approved', is_approved === 'true');
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single review by ID
app.get('/reviews/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, movies(*), users(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new review (protected)
app.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { movie_id, rating, review_text } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: req.user.userId,
        movie_id,
        rating,
        review_text,
        is_approved: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update review (protected)
app.put('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { rating, review_text, is_approved } = req.body;
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        review_text,
        is_approved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE review (protected)
app.delete('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Review deleted successfully' });
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
