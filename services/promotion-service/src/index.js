require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'promotion-service';
const PORT = process.env.PORT || 4016;
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

// GET all promotions
app.get('/promotions', async (req, res) => {
  try {
    const { is_active, movie_id, cinema_id } = req.query;
    let query = supabase.from('promotions').select('*, movies(*), cinemas(*)');
    
    if (is_active) query = query.eq('is_active', is_active === 'true');
    if (movie_id) query = query.eq('movie_id', movie_id);
    if (cinema_id) query = query.eq('cinema_id', cinema_id);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single promotion by ID
app.get('/promotions/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, movies(*), cinemas(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new promotion (protected)
app.post('/promotions', authenticateToken, async (req, res) => {
  try {
    const { title, description, banner_url, movie_id, cinema_id, discount_percentage, start_date, end_date } = req.body;
    
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        title,
        description,
        banner_url,
        movie_id,
        cinema_id,
        discount_percentage,
        start_date,
        end_date,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update promotion (protected)
app.put('/promotions/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, banner_url, movie_id, cinema_id, discount_percentage, start_date, end_date, is_active } = req.body;
    
    const { data, error } = await supabase
      .from('promotions')
      .update({
        title,
        description,
        banner_url,
        movie_id,
        cinema_id,
        discount_percentage,
        start_date,
        end_date,
        is_active,
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE promotion (protected)
app.delete('/promotions/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Promotion deleted successfully' });
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
