require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const supabase = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SERVICE_NAME = process.env.SERVICE_NAME || 'showtime-service';
const PORT = process.env.PORT || 4005;
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

// GET all showtimes
app.get('/showtimes', async (req, res) => {
  try {
    const { movie_id, hall_id, cinema_id, show_date, status } = req.query;
    let query = supabase
      .from('showtimes')
      .select('*, movies(*), halls(*), cinemas(*)');
    
    if (movie_id) query = query.eq('movie_id', movie_id);
    if (hall_id) query = query.eq('hall_id', hall_id);
    if (cinema_id) query = query.eq('cinema_id', cinema_id);
    if (show_date) query = query.eq('show_date', show_date);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single showtime by ID
app.get('/showtimes/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('showtimes')
      .select('*, movies(*), halls(*), cinemas(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new showtime (protected)
app.post('/showtimes', authenticateToken, async (req, res) => {
  try {
    const { movie_id, hall_id, cinema_id, show_date, start_time, end_time, base_price, status } = req.body;
    
    const { data, error } = await supabase
      .from('showtimes')
      .insert({
        movie_id,
        hall_id,
        cinema_id,
        show_date,
        start_time,
        end_time,
        base_price,
        status: status || 'scheduled',
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update showtime (protected)
app.put('/showtimes/:id', authenticateToken, async (req, res) => {
  try {
    const { show_date, start_time, end_time, base_price, status } = req.body;
    
    const { data, error } = await supabase
      .from('showtimes')
      .update({
        show_date,
        start_time,
        end_time,
        base_price,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE showtime (protected)
app.delete('/showtimes/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('showtimes')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ message: 'Showtime deleted successfully' });
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
